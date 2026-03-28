// @vitest-environment jsdom

import React from 'react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { SettingsPanel } from '../../src/renderer/components/settings/SettingsPanel'
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_INTERFACE_SETTINGS,
  DEFAULT_PRACTICE_SETTINGS,
  useAppSettingsStore
} from '../../src/renderer/stores/app-settings-store'
import { useAudioStore } from '../../src/renderer/stores/audio-store'
import { useMetronomeStore } from '../../src/renderer/stores/metronome-store'
import { useTunerStore } from '../../src/renderer/stores/tuner-store'
import { useUiStore } from '../../src/renderer/stores/ui-store'

const useAudioEngine = vi.fn()
const useDevices = vi.fn()
const useSystemStatus = vi.fn()

vi.mock('../../src/renderer/hooks/useAudioEngine', () => ({
  useAudioEngine: (...args: unknown[]) => useAudioEngine(...args)
}))
vi.mock('../../src/renderer/hooks/useDevices', () => ({
  useDevices: (...args: unknown[]) => useDevices(...args)
}))
vi.mock('../../src/renderer/hooks/useSystemStatus', () => ({
  useSystemStatus: (...args: unknown[]) => useSystemStatus(...args)
}))
vi.mock('../../src/renderer/components/layout/PageHeader', () => ({
  PageHeader: ({ title }: { title: string }) => <div>{title}</div>
}))
vi.mock('../../src/renderer/components/audio/DeviceSelector', () => ({
  DeviceSelector: () => <div>Device Selector</div>
}))
vi.mock('../../src/renderer/components/audio/VolumeSlider', () => ({
  VolumeSlider: () => <div>Volume Slider</div>
}))
vi.mock('../../src/renderer/components/audio/AudioMeter', () => ({
  AudioMeter: () => <div>Audio Meter</div>
}))
vi.mock('../../src/renderer/components/audio/LatencyIndicator', () => ({
  LatencyIndicator: () => <div>Latency Indicator</div>
}))
vi.mock('../../src/renderer/components/common/BpmControl', () => ({
  BpmControl: ({ bpm, setBpm }: { bpm: number; setBpm: (value: number) => void }) => (
    <button onClick={() => setBpm(bpm + 1)}>Bpm {bpm}</button>
  )
}))

function sectionFor(title: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: title, level: 2 })
  const section = heading.closest('section')
  if (!section) throw new Error(`Missing section for ${title}`)
  return section
}

describe('SettingsPanel', () => {
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
    useTunerStore.setState({
      frequency: 0,
      noteName: '-',
      octave: 0,
      centsOffset: 0,
      clarity: 0,
      isActive: false,
      referenceA4: DEFAULT_PRACTICE_SETTINGS.referenceA4,
      selectedPreset: DEFAULT_PRACTICE_SETTINGS.tuningPreset,
      targetNotes: ['E', 'A', 'D', 'G', 'B', 'E']
    })
    useMetronomeStore.setState({
      bpm: DEFAULT_PRACTICE_SETTINGS.metronomeBpm,
      beatsPerMeasure: DEFAULT_PRACTICE_SETTINGS.metronomeBeatsPerMeasure,
      isPlaying: false,
      currentBeat: 0,
      accentFirst: DEFAULT_PRACTICE_SETTINGS.metronomeAccentFirst
    })
    useUiStore.setState({ notices: [] })

    useAudioEngine.mockReturnValue({
      isConnected: false,
      inputDeviceId: null,
      connect: vi.fn(),
      disconnect: vi.fn()
    })
    useDevices.mockReturnValue({
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

  it('resets audio, practice, and interface settings back to defaults', () => {
    const disconnect = vi.fn()
    useAudioEngine.mockReturnValue({
      isConnected: true,
      inputDeviceId: 'input-1',
      connect: vi.fn(),
      disconnect
    })

    useAppSettingsStore.setState({
      audio: {
        ...DEFAULT_AUDIO_SETTINGS,
        masterVolume: 0.4,
        autoReconnect: false,
        monitoringEnabled: false
      },
      practice: {
        ...DEFAULT_PRACTICE_SETTINGS,
        referenceA4: 435,
        tuningPreset: 'Drop D',
        metronomeBpm: 142,
        metronomeBeatsPerMeasure: 6,
        metronomeAccentFirst: false
      },
      interface: {
        ...DEFAULT_INTERFACE_SETTINGS,
        showTooltips: false,
        reducedMotion: true,
        compactControls: true
      }
    })
    useTunerStore.setState({
      referenceA4: 435,
      selectedPreset: 'Drop D',
      targetNotes: ['D', 'A', 'D', 'G', 'B', 'E']
    })
    useMetronomeStore.setState({
      bpm: 142,
      beatsPerMeasure: 6,
      accentFirst: false
    })

    render(<SettingsPanel />)

    fireEvent.click(within(sectionFor('Audio')).getByRole('button', { name: 'Reset' }))
    expect(useAppSettingsStore.getState().audio).toEqual(DEFAULT_AUDIO_SETTINGS)
    expect(disconnect).toHaveBeenCalledTimes(1)

    fireEvent.click(within(sectionFor('Practice Defaults')).getByRole('button', { name: 'Reset' }))
    expect(useAppSettingsStore.getState().practice).toEqual(DEFAULT_PRACTICE_SETTINGS)
    expect(useTunerStore.getState().referenceA4).toBe(DEFAULT_PRACTICE_SETTINGS.referenceA4)
    expect(useTunerStore.getState().selectedPreset).toBe(DEFAULT_PRACTICE_SETTINGS.tuningPreset)
    expect(useMetronomeStore.getState().bpm).toBe(DEFAULT_PRACTICE_SETTINGS.metronomeBpm)
    expect(useMetronomeStore.getState().beatsPerMeasure).toBe(
      DEFAULT_PRACTICE_SETTINGS.metronomeBeatsPerMeasure
    )
    expect(useMetronomeStore.getState().accentFirst).toBe(
      DEFAULT_PRACTICE_SETTINGS.metronomeAccentFirst
    )

    fireEvent.click(within(sectionFor('Interface')).getByRole('button', { name: 'Reset' }))
    expect(useAppSettingsStore.getState().interface).toEqual(DEFAULT_INTERFACE_SETTINGS)
    expect(useUiStore.getState().notices).toHaveLength(3)
  })

  it('renders disabled connect state and the hot-monitoring warning copy', () => {
    useAppSettingsStore.getState().setAudioSetting('masterVolume', 0.95)
    useAppSettingsStore.getState().setAudioSetting('monitoringEnabled', true)

    render(<SettingsPanel />)

    const audioSection = sectionFor('Audio')

    expect(screen.getByRole('button', { name: 'Connect Selected Input' })).toBeDisabled()
    expect(screen.getByText('set fairly hot')).toBeInTheDocument()
    expect(audioSection).toHaveTextContent(
      'Use headphones or lower the volume before playing through speakers.'
    )
  })

  it('shows success diagnostics only when permission and input selection are both healthy', async () => {
    const refreshDevices = vi.fn(async () => {
      useAudioStore.setState({
        permissionState: 'granted',
        isConnected: true,
        inputLevel: 0.4,
        inputDevices: [{ id: 'input-1', label: 'Interface', kind: 'audioinput' }],
        outputDevices: [{ id: 'output-1', label: 'Monitors', kind: 'audiooutput' }]
      })
      useAppSettingsStore.getState().setAudioSetting('inputDeviceId', 'input-1')
      useAppSettingsStore.getState().setAudioSetting('outputDeviceId', 'output-1')
    })
    useDevices.mockReturnValue({ refreshDevices })
    useSystemStatus.mockReturnValue({
      permissionState: 'granted',
      isConnected: true,
      inputDeviceId: 'input-1',
      inputDeviceLabel: 'Interface',
      outputDeviceId: 'output-1',
      outputDeviceLabel: 'Monitors',
      inputLevel: 0.4,
      signalBand: 'healthy',
      signalLabel: 'Healthy',
      latencyMs: 12,
      latencyBand: 'good',
      latencyLabel: 'Good (12.0ms)',
      activeMode: 'Live Input',
      lastRecoverableError: null,
      devicesLoading: false
    })

    render(<SettingsPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Run Audio Check' }))

    expect(
      await screen.findByText('Audio check passed. Soundgarden is ready for live input.')
    ).toBeInTheDocument()
    expect(screen.getByText('Input route: Interface.')).toBeInTheDocument()
    expect(screen.getByText('Live audio is connected with healthy signal.')).toBeInTheDocument()
  })

  it('shows warning diagnostics when permission is denied or no input is selected', async () => {
    const refreshDevices = vi.fn(async () => {
      useAudioStore.setState({
        permissionState: 'denied',
        isConnected: false,
        inputLevel: 0,
        inputDevices: [],
        outputDevices: []
      })
      useAppSettingsStore.getState().setAudioSetting('inputDeviceId', null)
      useAppSettingsStore.getState().setAudioSetting('outputDeviceId', null)
    })
    useDevices.mockReturnValue({ refreshDevices })

    render(<SettingsPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Run Audio Check' }))

    expect(
      await screen.findByText('Audio check found a few setup issues to resolve.')
    ).toBeInTheDocument()
    expect(screen.getByText('Microphone permission is blocked.')).toBeInTheDocument()
    expect(screen.getByText('No input device is selected.')).toBeInTheDocument()
    expect(screen.getByText('Live audio is not connected.')).toBeInTheDocument()
  })
})
