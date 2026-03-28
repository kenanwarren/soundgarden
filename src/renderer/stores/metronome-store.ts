import { create } from 'zustand'
import { useAppSettingsStore } from './app-settings-store'

interface MetronomeState {
  bpm: number
  beatsPerMeasure: number
  isPlaying: boolean
  currentBeat: number
  accentFirst: boolean

  setBpm: (bpm: number) => void
  setBeatsPerMeasure: (beats: number) => void
  setPlaying: (playing: boolean) => void
  setCurrentBeat: (beat: number) => void
  setAccentFirst: (accent: boolean) => void
  hydrateFromSettings: () => void
}

function getPracticeSettings() {
  return useAppSettingsStore.getState().practice
}

export const useMetronomeStore = create<MetronomeState>((set) => {
  const practice = getPracticeSettings()

  return {
    bpm: practice.metronomeBpm,
    beatsPerMeasure: practice.metronomeBeatsPerMeasure,
    isPlaying: false,
    currentBeat: 0,
    accentFirst: practice.metronomeAccentFirst,

    setBpm: (bpm) => {
      const next = Math.max(20, Math.min(300, bpm))
      useAppSettingsStore.getState().setPracticeSetting('metronomeBpm', next)
      set({ bpm: next })
    },
    setBeatsPerMeasure: (beats) => {
      useAppSettingsStore.getState().setPracticeSetting('metronomeBeatsPerMeasure', beats)
      set({ beatsPerMeasure: beats })
    },
    setPlaying: (playing) => set({ isPlaying: playing, currentBeat: 0 }),
    setCurrentBeat: (beat) => set({ currentBeat: beat }),
    setAccentFirst: (accent) => {
      useAppSettingsStore.getState().setPracticeSetting('metronomeAccentFirst', accent)
      set({ accentFirst: accent })
    },
    hydrateFromSettings: () => {
      const next = getPracticeSettings()
      set({
        bpm: next.metronomeBpm,
        beatsPerMeasure: next.metronomeBeatsPerMeasure,
        accentFirst: next.metronomeAccentFirst
      })
    }
  }
})
