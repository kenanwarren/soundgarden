import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AudioDeviceInfo } from '../audio/types'

interface AudioState {
  isConnected: boolean
  inputDeviceId: string | null
  outputDeviceId: string | null
  inputDevices: AudioDeviceInfo[]
  outputDevices: AudioDeviceInfo[]
  inputLevel: number
  masterVolume: number

  setConnected: (connected: boolean) => void
  setInputDeviceId: (id: string | null) => void
  setOutputDeviceId: (id: string | null) => void
  setDevices: (devices: AudioDeviceInfo[]) => void
  setInputLevel: (level: number) => void
  setMasterVolume: (volume: number) => void
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      isConnected: false,
      inputDeviceId: null,
      outputDeviceId: null,
      inputDevices: [],
      outputDevices: [],
      inputLevel: 0,
      masterVolume: 0.8,

      setConnected: (connected) => set({ isConnected: connected }),
      setInputDeviceId: (id) => set({ inputDeviceId: id }),
      setOutputDeviceId: (id) => set({ outputDeviceId: id }),
      setDevices: (devices) =>
        set({
          inputDevices: devices.filter((d) => d.kind === 'audioinput'),
          outputDevices: devices.filter((d) => d.kind === 'audiooutput')
        }),
      setInputLevel: (level) => set({ inputLevel: level }),
      setMasterVolume: (volume) => set({ masterVolume: volume })
    }),
    {
      name: 'tonefield-audio',
      partialize: (state) => ({
        inputDeviceId: state.inputDeviceId,
        outputDeviceId: state.outputDeviceId,
        masterVolume: state.masterVolume,
      })
    }
  )
)
