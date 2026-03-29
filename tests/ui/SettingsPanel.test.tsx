// @vitest-environment jsdom

import React from 'react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
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
import { renderWithRouter } from './render-with-router'

const useAudioEngine = vi.fn()
const useSystemStatus = vi.fn()

vi.mock('../../src/renderer/hooks/useAudioEngine', () => ({
  useAudioEngine: (...args: unknown[]) => useAudioEngine(...args)
}))
vi.mock('../../src/renderer/hooks/useSystemStatus', () => ({
  useSystemStatus: (...args: unknown[]) => useSystemStatus(...args)
}))
vi.mock('../../src/renderer/components/layout/PageHeader', () => ({
  PageHeader: ({ title }: { title: string }) => <div>{title}</div>
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
      lastRecoverableError: null,
      sampleRate: 48_000,
      latencyEstimateMs: 12
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
      disconnect: vi.fn()
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
    useAudioEngine.mockReturnValue({ disconnect })

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

    renderWithRouter(<SettingsPanel />, '/settings')

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

  it('shows the compact runtime snapshot and routes the user back to Setup for live controls', () => {
    useAppSettingsStore.getState().setAudioSetting('masterVolume', 0.95)
    useAppSettingsStore.getState().setAudioSetting('monitoringEnabled', true)
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

    renderWithRouter(<SettingsPanel />, '/settings')

    const audioSection = sectionFor('Audio')

    expect(audioSection).toHaveTextContent('Current runtime snapshot')
    expect(audioSection).toHaveTextContent(
      'Setup owns device routing and diagnostics. This panel stays focused on defaults and shows only a compact runtime summary.'
    )
    expect(within(audioSection).getByText('Healthy')).toBeInTheDocument()
    expect(within(audioSection).getByText('Good (12.0ms)')).toBeInTheDocument()
    expect(within(audioSection).getByText('95% (Hot)')).toBeInTheDocument()
    expect(within(audioSection).getByText('48 kHz')).toBeInTheDocument()
    expect(within(audioSection).getByRole('link', { name: 'Open Setup' })).toHaveAttribute(
      'href',
      '/'
    )
    expect(within(audioSection).getByRole('button', { name: 'Disconnect Input' })).toBeEnabled()
  })

  it('does not keep the old diagnostics and routing controls in Settings', () => {
    renderWithRouter(<SettingsPanel />, '/settings')

    expect(screen.queryByRole('button', { name: 'Run Audio Check' })).not.toBeInTheDocument()
    expect(screen.queryByText('Device Selector')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Connect Selected Input' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Setup' })).toBeInTheDocument()
  })
})
