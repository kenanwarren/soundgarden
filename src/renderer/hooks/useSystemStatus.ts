import { useMemo } from 'react'
import { useAudioStore } from '../stores/audio-store'
import { useAppSettingsStore } from '../stores/app-settings-store'
import { useTunerStore } from '../stores/tuner-store'
import { useChordStore } from '../stores/chord-store'
import { useScaleStore } from '../stores/scale-store'
import { useEarTrainingStore } from '../stores/ear-training-store'
import { useRhythmStore } from '../stores/rhythm-store'
import { useMetronomeStore } from '../stores/metronome-store'
import {
  getLatencyBand,
  getLatencyLabel,
  getSignalBand,
  getSignalLabel,
  type SystemStatus
} from '../utils/system-status'

function getDeviceLabel(
  deviceId: string | null,
  devices: Array<{ id: string; label: string }>,
  fallback: string
): string {
  if (!deviceId) return fallback
  return devices.find((device) => device.id === deviceId)?.label ?? 'Unavailable device'
}

export function useSystemStatus(): SystemStatus {
  const {
    isConnected,
    inputDevices,
    outputDevices,
    inputLevel,
    permissionState,
    devicesLoading,
    lastRecoverableError,
    latencyEstimateMs
  } = useAudioStore()
  const inputDeviceId = useAppSettingsStore((s) => s.audio.inputDeviceId)
  const outputDeviceId = useAppSettingsStore((s) => s.audio.outputDeviceId)
  const tunerActive = useTunerStore((s) => s.isActive)
  const chordActive = useChordStore((s) => s.isActive)
  const scalePractice = useScaleStore((s) => s.isPracticing)
  const earListening = useEarTrainingStore((s) => s.isListening)
  const rhythmRunning = useRhythmStore((s) => s.isRunning)
  const metronomePlaying = useMetronomeStore((s) => s.isPlaying)

  return useMemo(() => {
    const latencyMs = isConnected ? latencyEstimateMs : null
    const latencyBand = getLatencyBand(latencyMs, isConnected)
    const signalBand = getSignalBand(inputLevel, isConnected)

    let activeMode = 'Idle'
    if (earListening) activeMode = 'Ear Training'
    else if (tunerActive) activeMode = 'Tuner'
    else if (chordActive) activeMode = 'Chord Detection'
    else if (scalePractice) activeMode = 'Scale Practice'
    else if (rhythmRunning) activeMode = 'Rhythm Trainer'
    else if (metronomePlaying) activeMode = 'Metronome'
    else if (isConnected) activeMode = 'Live Input'

    return {
      permissionState,
      isConnected,
      inputDeviceId,
      inputDeviceLabel: getDeviceLabel(inputDeviceId, inputDevices, 'No input selected'),
      outputDeviceId,
      outputDeviceLabel: getDeviceLabel(outputDeviceId, outputDevices, 'Default output'),
      inputLevel,
      signalBand,
      signalLabel: getSignalLabel(signalBand),
      latencyMs,
      latencyBand,
      latencyLabel: getLatencyLabel(latencyBand, latencyMs),
      activeMode,
      lastRecoverableError,
      devicesLoading
    }
  }, [
    chordActive,
    devicesLoading,
    earListening,
    inputDeviceId,
    inputDevices,
    inputLevel,
    isConnected,
    lastRecoverableError,
    latencyEstimateMs,
    metronomePlaying,
    outputDeviceId,
    outputDevices,
    permissionState,
    rhythmRunning,
    scalePractice,
    tunerActive
  ])
}
