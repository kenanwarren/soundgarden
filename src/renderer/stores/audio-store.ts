import { create } from 'zustand'
import type { AudioDeviceInfo } from '../audio/types'
import type { PermissionState } from '../utils/system-status'

interface AudioState {
  isConnected: boolean
  inputDevices: AudioDeviceInfo[]
  outputDevices: AudioDeviceInfo[]
  inputLevel: number
  devicesLoading: boolean
  permissionState: PermissionState
  lastRecoverableError: string | null

  setConnected: (connected: boolean) => void
  setDevices: (devices: AudioDeviceInfo[]) => void
  setInputLevel: (level: number) => void
  setDevicesLoading: (loading: boolean) => void
  setPermissionState: (state: PermissionState) => void
  setLastRecoverableError: (error: string | null) => void
}

export const useAudioStore = create<AudioState>((set) => ({
  isConnected: false,
  inputDevices: [],
  outputDevices: [],
  inputLevel: 0,
  devicesLoading: false,
  permissionState: 'unknown',
  lastRecoverableError: null,

  setConnected: (connected) => set({ isConnected: connected }),
  setDevices: (devices) =>
    set({
      inputDevices: devices.filter((d) => d.kind === 'audioinput'),
      outputDevices: devices.filter((d) => d.kind === 'audiooutput')
    }),
  setInputLevel: (level) => set({ inputLevel: level }),
  setDevicesLoading: (loading) => set({ devicesLoading: loading }),
  setPermissionState: (permissionState) => set({ permissionState }),
  setLastRecoverableError: (lastRecoverableError) => set({ lastRecoverableError })
}))
