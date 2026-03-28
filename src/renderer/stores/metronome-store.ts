import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
}

export const useMetronomeStore = create<MetronomeState>()(
  persist(
    (set) => ({
      bpm: 120,
      beatsPerMeasure: 4,
      isPlaying: false,
      currentBeat: 0,
      accentFirst: true,

      setBpm: (bpm) => set({ bpm: Math.max(20, Math.min(300, bpm)) }),
      setBeatsPerMeasure: (beats) => set({ beatsPerMeasure: beats }),
      setPlaying: (playing) => set({ isPlaying: playing, currentBeat: 0 }),
      setCurrentBeat: (beat) => set({ currentBeat: beat }),
      setAccentFirst: (accent) => set({ accentFirst: accent })
    }),
    {
      name: 'tonefield-metronome',
      partialize: (state) => ({
        bpm: state.bpm,
        beatsPerMeasure: state.beatsPerMeasure,
        accentFirst: state.accentFirst
      })
    }
  )
)
