// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_INTERFACE_SETTINGS,
  DEFAULT_PRACTICE_SETTINGS,
  useAppSettingsStore
} from '../../src/renderer/stores/app-settings-store'
import { useAudioStore } from '../../src/renderer/stores/audio-store'
import { useDevices } from '../../src/renderer/hooks/useDevices'

const refreshAudioRuntimeDevices = vi.fn()

vi.mock('../../src/renderer/audio/runtime', () => ({
  refreshAudioRuntimeDevices: (...args: unknown[]) => refreshAudioRuntimeDevices(...args)
}))

describe('useDevices', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()

    useAppSettingsStore.setState({
      audio: { ...DEFAULT_AUDIO_SETTINGS },
      practice: { ...DEFAULT_PRACTICE_SETTINGS },
      interface: { ...DEFAULT_INTERFACE_SETTINGS }
    })
    useAudioStore.setState({
      isConnected: false,
      inputDevices: [{ id: 'input-1', label: 'Interface', kind: 'audioinput' }],
      outputDevices: [{ id: 'output-1', label: 'Monitors', kind: 'audiooutput' }],
      inputLevel: 0,
      devicesLoading: true,
      permissionState: 'unknown',
      lastRecoverableError: null,
      latencyEstimateMs: null,
      sampleRate: null
    })
    useAppSettingsStore.getState().setAudioSetting('inputDeviceId', 'input-1')
    useAppSettingsStore.getState().setAudioSetting('outputDeviceId', 'output-1')
  })

  afterEach(() => {
    cleanup()
  })

  it('exposes device lists, ids, and loading state directly from the stores', () => {
    const { result } = renderHook(() => useDevices())

    expect(result.current.inputDevices).toEqual([
      { id: 'input-1', label: 'Interface', kind: 'audioinput' }
    ])
    expect(result.current.outputDevices).toEqual([
      { id: 'output-1', label: 'Monitors', kind: 'audiooutput' }
    ])
    expect(result.current.inputDeviceId).toBe('input-1')
    expect(result.current.outputDeviceId).toBe('output-1')
    expect(result.current.devicesLoading).toBe(true)
  })

  it('updates persisted device selections through the app settings store', () => {
    const { result } = renderHook(() => useDevices())

    act(() => {
      result.current.setInputDeviceId('input-2')
      result.current.setOutputDeviceId(null)
    })

    expect(useAppSettingsStore.getState().audio.inputDeviceId).toBe('input-2')
    expect(useAppSettingsStore.getState().audio.outputDeviceId).toBeNull()
  })

  it('delegates refreshes to the shared audio runtime', async () => {
    refreshAudioRuntimeDevices.mockResolvedValue(undefined)

    const { result } = renderHook(() => useDevices())

    await act(async () => {
      await result.current.refreshDevices()
    })

    expect(refreshAudioRuntimeDevices).toHaveBeenCalledTimes(1)
  })
})
