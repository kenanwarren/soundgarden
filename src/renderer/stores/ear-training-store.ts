import { create } from 'zustand'
import type { Challenge } from '../utils/ear-training-challenge'

export type EarTrainingMode = 'note' | 'interval'

interface EarTrainingState {
  mode: EarTrainingMode
  currentChallenge: Challenge | null
  isListening: boolean
  score: number
  streak: number
  bestStreak: number
  total: number
  missedTargets: string[]
  lastResult: 'correct' | 'incorrect' | null
  setMode: (mode: EarTrainingMode) => void
  setChallenge: (challenge: Challenge) => void
  setListening: (listening: boolean) => void
  recordResult: (correct: boolean, missedTarget?: string) => void
  reset: () => void
}

export const useEarTrainingStore = create<EarTrainingState>()((set) => ({
  mode: 'note',
  currentChallenge: null,
  isListening: false,
  score: 0,
  streak: 0,
  bestStreak: 0,
  total: 0,
  missedTargets: [],
  lastResult: null,
  setMode: (mode) =>
    set({
      mode,
      score: 0,
      streak: 0,
      bestStreak: 0,
      total: 0,
      missedTargets: [],
      lastResult: null,
      currentChallenge: null
    }),
  setChallenge: (challenge) => set({ currentChallenge: challenge, isListening: false, lastResult: null }),
  setListening: (listening) => set({ isListening: listening }),
  recordResult: (correct, missedTarget) =>
    set((state) => {
      const streak = correct ? state.streak + 1 : 0
      return {
        score: correct ? state.score + 1 : state.score,
        streak,
        bestStreak: correct ? Math.max(state.bestStreak, streak) : state.bestStreak,
        total: state.total + 1,
        missedTargets:
          !correct && missedTarget
            ? state.missedTargets.includes(missedTarget)
              ? state.missedTargets
              : [...state.missedTargets, missedTarget].slice(0, 8)
            : state.missedTargets,
        lastResult: correct ? 'correct' : 'incorrect',
        isListening: false
      }
    }),
  reset: () =>
    set({
      score: 0,
      streak: 0,
      bestStreak: 0,
      total: 0,
      missedTargets: [],
      lastResult: null,
      currentChallenge: null
    })
}))
