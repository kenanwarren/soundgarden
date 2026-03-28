import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_A4_FREQUENCY, TUNING_PRESETS } from '../utils/constants'
import { zustandStorage } from '../utils/store-storage'

export type TuningPresetName = keyof typeof TUNING_PRESETS

export interface AudioSettings {
  inputDeviceId: string | null
  outputDeviceId: string | null
  masterVolume: number
  autoReconnect: boolean
  monitoringEnabled: boolean
}

export interface PracticeSettings {
  referenceA4: number
  tuningPreset: TuningPresetName
  metronomeBpm: number
  metronomeBeatsPerMeasure: number
  metronomeAccentFirst: boolean
}

export interface InterfaceSettings {
  showTooltips: boolean
  reducedMotion: boolean
  compactControls: boolean
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  inputDeviceId: null,
  outputDeviceId: null,
  masterVolume: 0.8,
  autoReconnect: true,
  monitoringEnabled: true
}

export const DEFAULT_PRACTICE_SETTINGS: PracticeSettings = {
  referenceA4: DEFAULT_A4_FREQUENCY,
  tuningPreset: 'Standard',
  metronomeBpm: 120,
  metronomeBeatsPerMeasure: 4,
  metronomeAccentFirst: true
}

export const DEFAULT_INTERFACE_SETTINGS: InterfaceSettings = {
  showTooltips: true,
  reducedMotion: false,
  compactControls: false
}

interface AppSettingsState {
  audio: AudioSettings
  practice: PracticeSettings
  interface: InterfaceSettings
  setAudioSetting: <K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) => void
  setPracticeSetting: <K extends keyof PracticeSettings>(key: K, value: PracticeSettings[K]) => void
  setInterfaceSetting: <K extends keyof InterfaceSettings>(
    key: K,
    value: InterfaceSettings[K]
  ) => void
  resetAudioSettings: () => void
  resetPracticeSettings: () => void
  resetInterfaceSettings: () => void
}

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      audio: DEFAULT_AUDIO_SETTINGS,
      practice: DEFAULT_PRACTICE_SETTINGS,
      interface: DEFAULT_INTERFACE_SETTINGS,
      setAudioSetting: (key, value) =>
        set((state) => ({
          audio: { ...state.audio, [key]: value }
        })),
      setPracticeSetting: (key, value) =>
        set((state) => ({
          practice: { ...state.practice, [key]: value }
        })),
      setInterfaceSetting: (key, value) =>
        set((state) => ({
          interface: { ...state.interface, [key]: value }
        })),
      resetAudioSettings: () => set({ audio: DEFAULT_AUDIO_SETTINGS }),
      resetPracticeSettings: () => set({ practice: DEFAULT_PRACTICE_SETTINGS }),
      resetInterfaceSettings: () => set({ interface: DEFAULT_INTERFACE_SETTINGS })
    }),
    {
      name: 'soundgarden-app-settings',
      storage: zustandStorage
    }
  )
)
