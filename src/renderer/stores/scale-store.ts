import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SCALES, type ScaleDefinition } from '../utils/scale-data'

interface ScaleState {
  selectedRoot: string
  selectedScaleIndex: number
  isPracticing: boolean
  hitNotes: string[]
  currentDetectedNote: string | null
  currentDetectedOctave: number | null
  setRoot: (root: string) => void
  setScaleIndex: (index: number) => void
  setPracticing: (practicing: boolean) => void
  registerHit: (note: string) => void
  setDetectedNote: (note: string | null, octave: number | null) => void
  resetProgress: () => void
}

export const useScaleStore = create<ScaleState>()(
  persist(
    (set) => ({
      selectedRoot: 'A',
      selectedScaleIndex: 4,
      isPracticing: false,
      hitNotes: [],
      currentDetectedNote: null,
      currentDetectedOctave: null,
      setRoot: (root) => set({ selectedRoot: root, hitNotes: [] }),
      setScaleIndex: (index) => set({ selectedScaleIndex: index, hitNotes: [] }),
      setPracticing: (practicing) =>
        set({ isPracticing: practicing, hitNotes: [], currentDetectedNote: null, currentDetectedOctave: null }),
      registerHit: (note) =>
        set((state) => ({
          hitNotes: state.hitNotes.includes(note) ? state.hitNotes : [...state.hitNotes, note]
        })),
      setDetectedNote: (note, octave) => set({ currentDetectedNote: note, currentDetectedOctave: octave }),
      resetProgress: () => set({ hitNotes: [], currentDetectedNote: null, currentDetectedOctave: null })
    }),
    {
      name: 'tonefield-scales',
      partialize: (state) => ({
        selectedRoot: state.selectedRoot,
        selectedScaleIndex: state.selectedScaleIndex
      })
    }
  )
)
