// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_INTERFACE_SETTINGS,
  DEFAULT_PRACTICE_SETTINGS,
  useAppSettingsStore
} from '../../src/renderer/stores/app-settings-store'
import { useAudioStore } from '../../src/renderer/stores/audio-store'
import { useChordStore } from '../../src/renderer/stores/chord-store'
import { useEarTrainingStore } from '../../src/renderer/stores/ear-training-store'
import { useMetronomeStore } from '../../src/renderer/stores/metronome-store'
import { useRhythmStore } from '../../src/renderer/stores/rhythm-store'
import { useScaleStore } from '../../src/renderer/stores/scale-store'
import { useTunerStore } from '../../src/renderer/stores/tuner-store'
import { useSystemStatus } from '../../src/renderer/hooks/useSystemStatus'
import {
  getLatencyBand,
  getLatencyLabel,
  getSignalBand,
  getSignalLabel
} from '../../src/renderer/utils/system-status'

describe('system-status', () => {
  beforeEach(() => {
    localStorage.clear()

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
      latencyEstimateMs: null,
      sampleRate: null
    })
    useTunerStore.setState({ isActive: false })
    useChordStore.setState({
      isActive: false,
      currentChord: null,
      chromagram: null,
      tickCount: 0,
      peakDb: -Infinity
    })
    useScaleStore.setState({
      selectedRoot: 'A',
      selectedScaleIndex: 4,
      isPracticing: false,
      hitNotes: [],
      currentDetectedNote: null,
      currentDetectedOctave: null
    })
    useEarTrainingStore.setState({
      mode: 'note',
      challengePresetId: null,
      currentChallenge: null,
      isListening: false,
      score: 0,
      streak: 0,
      bestStreak: 0,
      total: 0,
      missedTargets: [],
      lastResult: null
    })
    useRhythmStore.setState({
      selectedPatternIndex: 1,
      isRunning: false,
      sensitivity: 'mid',
      results: [],
      accuracy: null,
      currentSubdivision: 0,
      hitCount: 0,
      missCount: 0,
      streak: 0,
      bestStreak: 0,
      lastHitGrade: null,
      lastHitTime: 0
    })
    useMetronomeStore.setState({
      bpm: 120,
      beatsPerMeasure: 4,
      isPlaying: false,
      currentBeat: 0,
      accentFirst: true
    })
  })

  it('prefers the highest-priority active practice mode and uses unavailable-device fallbacks', () => {
    useAudioStore.setState({
      isConnected: true,
      inputLevel: 0.91,
      latencyEstimateMs: 40,
      inputDevices: [{ id: 'input-1', label: 'Interface', kind: 'audioinput' }],
      outputDevices: [{ id: 'output-1', label: 'Monitors', kind: 'audiooutput' }]
    })
    useAppSettingsStore.getState().setAudioSetting('inputDeviceId', 'missing-input')
    useAppSettingsStore.getState().setAudioSetting('outputDeviceId', 'missing-output')
    useMetronomeStore.setState({ isPlaying: true })
    useRhythmStore.setState({ isRunning: true })
    useScaleStore.setState({ isPracticing: true })
    useChordStore.setState({ isActive: true })
    useTunerStore.setState({ isActive: true })
    useEarTrainingStore.setState({ isListening: true })

    const { result } = renderHook(() => useSystemStatus())

    expect(result.current.activeMode).toBe('Ear Training')
    expect(result.current.inputDeviceLabel).toBe('Unavailable device')
    expect(result.current.outputDeviceLabel).toBe('Unavailable device')
    expect(result.current.latencyBand).toBe('high')
    expect(result.current.signalBand).toBe('hot')
    expect(result.current.signalLabel).toBe('Hot')
  })

  it('returns live-input mode when no training tool is active', () => {
    useAudioStore.setState({ isConnected: true, inputLevel: 0.2, latencyEstimateMs: 40 })

    const { result } = renderHook(() => useSystemStatus())

    expect(result.current.activeMode).toBe('Live Input')
    expect(result.current.outputDeviceLabel).toBe('Default output')
    expect(result.current.latencyLabel).toBe('High (40.0ms)')
  })

  it('classifies latency and signal bands consistently at the boundaries', () => {
    expect(getLatencyBand(null, true)).toBe('offline')
    expect(getLatencyBand(15, true)).toBe('good')
    expect(getLatencyBand(35, true)).toBe('playable')
    expect(getLatencyBand(36, true)).toBe('high')
    expect(getLatencyLabel('good', 12.04)).toBe('Good (12.0ms)')

    expect(getSignalBand(0.02, true)).toBe('silent')
    expect(getSignalBand(0.03, true)).toBe('low')
    expect(getSignalBand(0.18, true)).toBe('healthy')
    expect(getSignalBand(0.8, true)).toBe('hot')
    expect(getSignalBand(0.95, true)).toBe('clipping')
    expect(getSignalLabel('clipping')).toBe('Clipping')
  })
})
