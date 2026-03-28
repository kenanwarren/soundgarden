// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_INTERFACE_SETTINGS,
  DEFAULT_PRACTICE_SETTINGS,
  useAppSettingsStore
} from '../../src/renderer/stores/app-settings-store'
import { useAudioStore } from '../../src/renderer/stores/audio-store'
import { useDevices } from '../../src/renderer/hooks/useDevices'
import { useUiStore } from '../../src/renderer/stores/ui-store'

const getEngine = vi.fn()

vi.mock('../../src/renderer/hooks/useAudioEngine', () => ({
  getEngine: (...args: unknown[]) => getEngine(...args)
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
      inputDevices: [],
      outputDevices: [],
      inputLevel: 0,
      devicesLoading: false,
      permissionState: 'unknown',
      lastRecoverableError: null
    })
    useUiStore.setState({ notices: [] })
  })

  afterEach(() => {
    cleanup()
  })

  it('refreshes devices, clears missing saved outputs, and splits input/output lists', async () => {
    getEngine.mockReturnValue({
      enumerateDevices: vi.fn().mockResolvedValue([
        { id: 'input-1', label: 'Interface', kind: 'audioinput' },
        { id: 'output-2', label: 'Monitors', kind: 'audiooutput' }
      ])
    })
    useAppSettingsStore.getState().setAudioSetting('outputDeviceId', 'missing-output')

    const { result } = renderHook(() => useDevices())

    await act(async () => {
      await result.current.refreshDevices()
    })

    await waitFor(() =>
      expect(useAudioStore.getState().outputDevices).toEqual([
        { id: 'output-2', label: 'Monitors', kind: 'audiooutput' }
      ])
    )

    expect(useAudioStore.getState().inputDevices).toEqual([
      { id: 'input-1', label: 'Interface', kind: 'audioinput' }
    ])
    expect(useAppSettingsStore.getState().audio.outputDeviceId).toBeNull()
    expect(useAudioStore.getState().lastRecoverableError).toBe(
      'Your saved output device is unavailable. Soundgarden switched back to the default output.'
    )
    expect(useAudioStore.getState().devicesLoading).toBe(false)
  })

  it('surfaces permission-denied status when devices still enumerate successfully', async () => {
    getEngine.mockReturnValue({
      enumerateDevices: vi
        .fn()
        .mockResolvedValue([{ id: 'input-1', label: 'Interface', kind: 'audioinput' }])
    })
    useAudioStore.getState().setPermissionState('denied')

    const { result } = renderHook(() => useDevices())

    await act(async () => {
      await result.current.refreshDevices()
    })

    expect(useAudioStore.getState().lastRecoverableError).toBe(
      'Microphone access is blocked. Grant permission to use live audio features.'
    )
    expect(useUiStore.getState().notices).toEqual([])
  })

  it('handles refresh failures by clearing the loading flag and posting an error notice', async () => {
    getEngine.mockReturnValue({
      enumerateDevices: vi.fn().mockRejectedValue(new Error('USB bus unavailable'))
    })

    const { result } = renderHook(() => useDevices())

    await act(async () => {
      await result.current.refreshDevices()
    })

    expect(useAudioStore.getState().devicesLoading).toBe(false)
    expect(useAudioStore.getState().lastRecoverableError).toBe('Could not refresh audio devices.')
    expect(useUiStore.getState().notices[0]).toMatchObject({
      tone: 'error',
      title: 'Device refresh failed',
      description: 'Error: USB bus unavailable'
    })
  })
})
