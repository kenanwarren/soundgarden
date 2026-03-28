// @vitest-environment jsdom

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_INTERFACE_SETTINGS,
  DEFAULT_PRACTICE_SETTINGS,
  useAppSettingsStore
} from '../../src/renderer/stores/app-settings-store'
import { useAudioStore } from '../../src/renderer/stores/audio-store'
import { useUiStore } from '../../src/renderer/stores/ui-store'

type Device = { id: string; label: string; kind: 'audioinput' | 'audiooutput' }

type EngineConfig = {
  devices: Device[]
  connectError?: Error
  setOutputDeviceError?: Error
}

let runtimeConfig = { enabled: false, audioMode: null as string | null }
let nextAudioEngineConfig: EngineConfig = { devices: [] }
let nextFakeEngineConfig: EngineConfig = { devices: [] }
let lastAudioEngine: HookTestEngine | null = null
let lastFakeEngine: HookTestEngine | null = null
let hookModule: typeof import('../../src/renderer/hooks/useAudioEngine')

class HookTestEngine {
  readonly initialize = vi.fn(async () => {})
  readonly enumerateDevices = vi.fn(async () => this.config.devices)
  readonly disconnectInput = vi.fn(() => {
    this._isRunning = false
    this.levelCallback?.(0)
  })
  readonly setMasterVolume = vi.fn((value: number) => {
    this.masterVolume = value
  })
  readonly dispose = vi.fn(async () => {})
  readonly setOutputDevice = vi.fn(async (_deviceId: string) => {
    if (this.config.setOutputDeviceError) {
      throw this.config.setOutputDeviceError
    }
  })
  readonly connectInput = vi.fn(async (_deviceId: string) => {
    if (this.config.connectError) {
      throw this.config.connectError
    }
    this._isRunning = true
    this.levelCallback?.(0.34)
  })

  levelCallback: ((level: number) => void) | null = null
  deviceChangeCallback: (() => void) | null = null
  masterVolume = 0
  _isRunning = false
  sampleRate = 48_000
  latencyEstimate = 0.012

  constructor(private readonly config: EngineConfig) {}

  get isRunning(): boolean {
    return this._isRunning
  }

  onDeviceChange(callback: () => void): () => void {
    this.deviceChangeCallback = callback
    return () => {
      if (this.deviceChangeCallback === callback) {
        this.deviceChangeCallback = null
      }
    }
  }

  onLevel(callback: (level: number) => void): void {
    this.levelCallback = callback
  }

  getPipeline(): null {
    return null
  }

  getContext(): null {
    return null
  }
}

beforeAll(async () => {
  vi.doMock('../../src/renderer/audio/engine', () => ({
    AudioEngine: class AudioEngine extends HookTestEngine {
      constructor() {
        super(nextAudioEngineConfig)
        lastAudioEngine = this
      }
    }
  }))
  vi.doMock('../../src/renderer/audio/fake-engine', () => ({
    FakeAudioEngine: class FakeAudioEngine extends HookTestEngine {
      constructor(_mode: string) {
        super(nextFakeEngineConfig)
        lastFakeEngine = this
      }
    },
    DEFAULT_FAKE_INPUT_DEVICE_ID: 'fake-input',
    DEFAULT_FAKE_OUTPUT_DEVICE_ID: 'fake-output'
  }))
  vi.doMock('../../src/renderer/utils/e2e-runtime', () => ({
    getE2ERuntimeConfig: () => runtimeConfig
  }))

  hookModule = await import('../../src/renderer/hooks/useAudioEngine')
})

function resetStores(): void {
  useAppSettingsStore.setState({
    audio: { ...DEFAULT_AUDIO_SETTINGS },
    practice: { ...DEFAULT_PRACTICE_SETTINGS },
    interface: { ...DEFAULT_INTERFACE_SETTINGS }
  })
  useAudioStore.setState({
    isConnected: false,
    inputDevices: [],
    outputDevices: [],
    inputLevel: 0,
    devicesLoading: false,
    permissionState: 'unknown',
    lastRecoverableError: null
  })
  useUiStore.setState({ notices: [] })
}

describe('useAudioEngine', () => {
  beforeEach(() => {
    localStorage.clear()
    cleanup()
    vi.clearAllMocks()

    runtimeConfig = { enabled: false, audioMode: null }
    nextAudioEngineConfig = {
      devices: [
        { id: 'input-1', label: 'Interface', kind: 'audioinput' },
        { id: 'output-1', label: 'Monitors', kind: 'audiooutput' }
      ]
    }
    nextFakeEngineConfig = {
      devices: [
        { id: 'fake-input', label: 'Fake Interface', kind: 'audioinput' },
        { id: 'fake-output', label: 'Fake Monitors', kind: 'audiooutput' }
      ]
    }
    lastAudioEngine = null
    lastFakeEngine = null
    resetStores()

    Object.defineProperty(window.navigator, 'permissions', {
      configurable: true,
      value: {
        query: vi.fn().mockResolvedValue({
          state: 'granted',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        })
      }
    })
    Object.defineProperty(window.navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }]
        })
      }
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('clears missing saved inputs during initialization and posts a warning notice', async () => {
    const { useAudioEngineInit } = hookModule

    useAppSettingsStore.getState().setAudioSetting('inputDeviceId', 'missing-input')
    useAudioStore.getState().setConnected(true)

    const { unmount } = renderHook(() => useAudioEngineInit())

    await waitFor(() => expect(lastAudioEngine?.initialize).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(useAppSettingsStore.getState().audio.inputDeviceId).toBeNull())

    expect(lastAudioEngine?.disconnectInput).toHaveBeenCalledTimes(1)
    expect(useAudioStore.getState().isConnected).toBe(false)
    expect(useAudioStore.getState().lastRecoverableError).toBe(
      'Your saved input device is unavailable. Select another input to continue.'
    )
    expect(useUiStore.getState().notices[0]).toMatchObject({
      tone: 'warning',
      title: 'Input device unavailable'
    })

    unmount()
  })

  it('stores a reconnect failure when auto-reconnect cannot restore the saved input', async () => {
    const { useAudioEngineInit } = hookModule

    nextAudioEngineConfig = {
      ...nextAudioEngineConfig,
      connectError: new Error('Port busy')
    }
    useAppSettingsStore.getState().setAudioSetting('inputDeviceId', 'input-1')

    const { unmount } = renderHook(() => useAudioEngineInit())

    await waitFor(() => expect(lastAudioEngine?.connectInput).toHaveBeenCalledWith('input-1'))

    expect(useAudioStore.getState().isConnected).toBe(false)
    expect(useAudioStore.getState().lastRecoverableError).toBe(
      'Soundgarden could not reconnect to the saved input device.'
    )
    expect(useUiStore.getState().notices[0]).toMatchObject({
      tone: 'warning',
      title: 'Reconnect failed',
      description: 'Error: Port busy'
    })

    unmount()
  })

  it('marks permission as denied when microphone access is blocked during initialization', async () => {
    const { useAudioEngineInit } = hookModule

    Object.defineProperty(window.navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))
      }
    })

    const { unmount } = renderHook(() => useAudioEngineInit())

    await waitFor(() => expect(lastAudioEngine?.enumerateDevices).toHaveBeenCalledTimes(1))

    expect(useAudioStore.getState().permissionState).toBe('denied')
    expect(useAudioStore.getState().lastRecoverableError).toBe(
      'Microphone access is blocked. Grant permission to use live audio features.'
    )

    unmount()
  })

  it('propagates master-volume changes and reports output-switch failures', async () => {
    const { useAudioEngine, useAudioEngineInit } = hookModule

    nextAudioEngineConfig = {
      ...nextAudioEngineConfig,
      setOutputDeviceError: new Error('Output unavailable')
    }

    const { unmount } = renderHook(() => {
      useAudioEngineInit()
      return useAudioEngine()
    })

    await waitFor(() => expect(lastAudioEngine?.setMasterVolume).toHaveBeenCalledWith(0.8))

    act(() => {
      useAppSettingsStore.getState().setAudioSetting('masterVolume', 0.35)
    })

    await waitFor(() => expect(lastAudioEngine?.setMasterVolume).toHaveBeenLastCalledWith(0.35))

    act(() => {
      useAppSettingsStore.getState().setAudioSetting('monitoringEnabled', false)
    })

    await waitFor(() => expect(lastAudioEngine?.setMasterVolume).toHaveBeenLastCalledWith(0))

    act(() => {
      useAppSettingsStore.getState().setAudioSetting('outputDeviceId', 'output-2')
    })

    await waitFor(() =>
      expect(useAudioStore.getState().lastRecoverableError).toBe(
        'Soundgarden could not switch to the selected output device.'
      )
    )

    expect(useUiStore.getState().notices[0]).toMatchObject({
      tone: 'warning',
      title: 'Output switch failed',
      description: 'Error: Output unavailable'
    })

    unmount()
  })

  it('uses the fake engine path in e2e mode and applies default fake devices', async () => {
    const { useAudioEngineInit } = hookModule

    runtimeConfig = { enabled: true, audioMode: 'connected' }

    const { unmount } = renderHook(() => useAudioEngineInit())

    await waitFor(() => expect(lastFakeEngine?.initialize).toHaveBeenCalledTimes(1))

    expect(useAppSettingsStore.getState().audio.inputDeviceId).toBe('fake-input')
    expect(useAppSettingsStore.getState().audio.outputDeviceId).toBe('fake-output')
    expect(lastFakeEngine?.connectInput).toHaveBeenCalledWith('fake-input')
    expect(useAudioStore.getState().isConnected).toBe(true)

    unmount()
  })
})
