// @vitest-environment jsdom

import React from 'react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_INTERFACE_SETTINGS,
  DEFAULT_PRACTICE_SETTINGS,
  useAppSettingsStore
} from '../../src/renderer/stores/app-settings-store'
import { useAudioStore } from '../../src/renderer/stores/audio-store'
import { DeviceSelector } from '../../src/renderer/components/audio/DeviceSelector'
import { VolumeSlider } from '../../src/renderer/components/audio/VolumeSlider'
import { AudioMeter } from '../../src/renderer/components/audio/AudioMeter'
import { LatencyIndicator } from '../../src/renderer/components/audio/LatencyIndicator'

const useDevices = vi.fn()
const useSystemStatus = vi.fn()

vi.mock('../../src/renderer/hooks/useDevices', () => ({
  useDevices: (...args: unknown[]) => useDevices(...args)
}))
vi.mock('../../src/renderer/hooks/useSystemStatus', () => ({
  useSystemStatus: (...args: unknown[]) => useSystemStatus(...args)
}))

describe('audio widgets', () => {
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

    useDevices.mockReturnValue({
      inputDevices: [],
      outputDevices: [],
      inputDeviceId: null,
      outputDeviceId: null,
      setInputDeviceId: vi.fn(),
      setOutputDeviceId: vi.fn(),
      devicesLoading: false,
      refreshDevices: vi.fn()
    })
    useSystemStatus.mockReturnValue({
      permissionState: 'granted',
      isConnected: false,
      inputDeviceId: null,
      inputDeviceLabel: 'No input selected',
      outputDeviceId: null,
      outputDeviceLabel: 'Default output',
      inputLevel: 0,
      signalBand: 'offline',
      signalLabel: 'Offline',
      latencyMs: null,
      latencyBand: 'offline',
      latencyLabel: 'Offline',
      activeMode: 'Idle',
      lastRecoverableError: null,
      devicesLoading: false
    })
  })

  it('shows the permission-denied device copy and loading copy', () => {
    const baseDevices = {
      inputDevices: [],
      outputDevices: [],
      inputDeviceId: null,
      outputDeviceId: null,
      setInputDeviceId: vi.fn(),
      setOutputDeviceId: vi.fn(),
      refreshDevices: vi.fn()
    }
    const baseStatus = {
      permissionState: 'granted',
      isConnected: false,
      inputDeviceId: null,
      inputDeviceLabel: 'No input selected',
      outputDeviceId: null,
      outputDeviceLabel: 'Default output',
      inputLevel: 0,
      signalBand: 'offline',
      signalLabel: 'Offline',
      latencyMs: null,
      latencyBand: 'offline',
      latencyLabel: 'Offline',
      activeMode: 'Idle',
      lastRecoverableError: null,
      devicesLoading: false
    }

    useDevices.mockReturnValueOnce({
      ...baseDevices,
      devicesLoading: false
    })
    useSystemStatus.mockReturnValueOnce({
      ...baseStatus,
      permissionState: 'denied'
    })

    const { rerender } = render(<DeviceSelector />)

    expect(
      screen.getByText(
        'Microphone access is blocked. Device labels may stay hidden until permission is granted.'
      )
    ).toBeInTheDocument()

    useDevices.mockReturnValue({
      ...baseDevices,
      devicesLoading: true
    })
    useSystemStatus.mockReturnValue({
      ...baseStatus,
      permissionState: 'granted'
    })

    rerender(<DeviceSelector />)

    expect(screen.getByText('Refreshing available devices…')).toBeInTheDocument()
  })

  it('shows muted and percentage states in the volume slider while updating the store', () => {
    const { rerender } = render(<VolumeSlider />)

    expect(screen.getByText('80%')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('slider'), { target: { value: '0.42' } })
    expect(useAppSettingsStore.getState().audio.masterVolume).toBe(0.42)

    useAppSettingsStore.getState().setAudioSetting('monitoringEnabled', false)

    rerender(<VolumeSlider />)
    expect(screen.getByText('Muted')).toBeInTheDocument()
  })

  it('renders signal and latency states from store and system status data', () => {
    useAudioStore.setState({ isConnected: true, inputLevel: 0.87 })
    useSystemStatus.mockReturnValue({
      permissionState: 'granted',
      isConnected: true,
      inputDeviceId: 'input-1',
      inputDeviceLabel: 'Interface',
      outputDeviceId: 'output-1',
      outputDeviceLabel: 'Monitors',
      inputLevel: 0.87,
      signalBand: 'hot',
      signalLabel: 'Hot',
      latencyMs: 12,
      latencyBand: 'good',
      latencyLabel: 'Good (12.0ms)',
      activeMode: 'Live Input',
      lastRecoverableError: null,
      devicesLoading: false
    })

    render(
      <>
        <AudioMeter />
        <LatencyIndicator />
      </>
    )

    expect(screen.getByText('Hot')).toBeInTheDocument()
    expect(screen.getByText('Good (12.0ms)')).toBeInTheDocument()
  })
})
