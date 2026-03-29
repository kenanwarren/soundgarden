import { create } from 'zustand'
import type { AudioDeviceInfo } from '../audio/types'
import type { PermissionState } from '../utils/system-status'

interface AudioState {
  isReady: boolean
  isConnected: boolean
  inputDevices: AudioDeviceInfo[]
  outputDevices: AudioDeviceInfo[]
  inputLevel: number
  devicesLoading: boolean
  permissionState: PermissionState
  lastRecoverableError: string | null
  sampleRate: number | null
  latencyEstimateMs: number | null

  setRuntimeReady: (ready: boolean) => void
  setConnected: (connected: boolean) => void
  setDevices: (devices: AudioDeviceInfo[]) => void
  setInputLevel: (level: number) => void
  setDevicesLoading: (loading: boolean) => void
  setPermissionState: (state: PermissionState) => void
  setLastRecoverableError: (error: string | null) => void
  setEngineMetrics: (sampleRate: number | null, latencyEstimateMs: number | null) => void
}

export const useAudioStore = create<AudioState>((set) => ({
  isReady: false,
  isConnected: false,
  inputDevices: [],
  outputDevices: [],
  inputLevel: 0,
  devicesLoading: false,
  permissionState: 'unknown',
  lastRecoverableError: null,
  sampleRate: null,
  latencyEstimateMs: null,

  setRuntimeReady: (isReady) => set({ isReady }),
  setConnected: (connected) => set({ isConnected: connected }),
  setDevices: (devices) =>
    set({
      inputDevices: devices.filter((d) => d.kind === 'audioinput'),
      outputDevices: devices.filter((d) => d.kind === 'audiooutput')
    }),
  setInputLevel: (level) => set({ inputLevel: level }),
  setDevicesLoading: (loading) => set({ devicesLoading: loading }),
  setPermissionState: (permissionState) => set({ permissionState }),
  setLastRecoverableError: (lastRecoverableError) => set({ lastRecoverableError }),
  setEngineMetrics: (sampleRate, latencyEstimateMs) => set({ sampleRate, latencyEstimateMs })
}))
