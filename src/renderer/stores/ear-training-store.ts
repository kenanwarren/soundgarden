import { create } from 'zustand'

export type EarTrainingMode = 'note' | 'interval'

interface Challenge {
  referenceNote: string
  referenceOctave: number
  targetNote: string
  targetOctave: number
  intervalSemitones: number
  intervalName: string
}

interface EarTrainingState {
  mode: EarTrainingMode
  currentChallenge: Challenge | null
  isListening: boolean
  score: number
  streak: number
  total: number
  lastResult: 'correct' | 'incorrect' | null
  setMode: (mode: EarTrainingMode) => void
  setChallenge: (challenge: Challenge) => void
  setListening: (listening: boolean) => void
  recordResult: (correct: boolean) => void
  reset: () => void
}

export const useEarTrainingStore = create<EarTrainingState>()((set) => ({
  mode: 'note',
  currentChallenge: null,
  isListening: false,
  score: 0,
  streak: 0,
  total: 0,
  lastResult: null,
  setMode: (mode) => set({ mode, score: 0, streak: 0, total: 0, lastResult: null, currentChallenge: null }),
  setChallenge: (challenge) => set({ currentChallenge: challenge, isListening: false, lastResult: null }),
  setListening: (listening) => set({ isListening: listening }),
  recordResult: (correct) =>
    set((state) => ({
      score: correct ? state.score + 1 : state.score,
      streak: correct ? state.streak + 1 : 0,
      total: state.total + 1,
      lastResult: correct ? 'correct' : 'incorrect',
      isListening: false
    })),
  reset: () => set({ score: 0, streak: 0, total: 0, lastResult: null, currentChallenge: null })
}))
