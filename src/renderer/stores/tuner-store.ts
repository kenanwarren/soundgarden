import { create } from 'zustand'
import { TUNING_PRESETS } from '../utils/constants'
import { useAppSettingsStore, type TuningPresetName } from './app-settings-store'

interface TunerState {
  frequency: number
  noteName: string
  octave: number
  centsOffset: number
  clarity: number
  isActive: boolean
  referenceA4: number
  selectedPreset: TuningPresetName
  targetNotes: string[]

  setTunerData: (
    frequency: number,
    noteName: string,
    octave: number,
    cents: number,
    clarity: number
  ) => void
  setActive: (active: boolean) => void
  setReferenceA4: (freq: number) => void
  setPreset: (preset: TuningPresetName) => void
  hydrateFromSettings: () => void
}

function getPracticeSettings() {
  return useAppSettingsStore.getState().practice
}

export const useTunerStore = create<TunerState>((set) => {
  const practice = getPracticeSettings()

  return {
    frequency: 0,
    noteName: '-',
    octave: 0,
    centsOffset: 0,
    clarity: 0,
    isActive: false,
    referenceA4: practice.referenceA4,
    selectedPreset: practice.tuningPreset,
    targetNotes: TUNING_PRESETS[practice.tuningPreset] ?? [],

    setTunerData: (frequency, noteName, octave, cents, clarity) =>
      set({ frequency, noteName, octave, centsOffset: cents, clarity }),
    setActive: (active) => set({ isActive: active }),
    setReferenceA4: (freq) => {
      useAppSettingsStore.getState().setPracticeSetting('referenceA4', freq)
      set({ referenceA4: freq })
    },
    setPreset: (preset) => {
      useAppSettingsStore.getState().setPracticeSetting('tuningPreset', preset)
      set({ selectedPreset: preset, targetNotes: TUNING_PRESETS[preset] })
    },
    hydrateFromSettings: () => {
      const next = getPracticeSettings()
      set({
        referenceA4: next.referenceA4,
        selectedPreset: next.tuningPreset,
        targetNotes: TUNING_PRESETS[next.tuningPreset]
      })
    }
  }
})
