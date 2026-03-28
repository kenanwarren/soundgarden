import { create } from 'zustand'

export interface TimingResult {
  expectedTime: number
  actualTime: number
  deltaMs: number
}

interface RhythmState {
  selectedPatternIndex: number
  isRunning: boolean
  results: TimingResult[]
  accuracy: number | null
  currentSubdivision: number
  setPatternIndex: (index: number) => void
  setRunning: (running: boolean) => void
  addResult: (result: TimingResult) => void
  setCurrentSubdivision: (sub: number) => void
  reset: () => void
}

export const useRhythmStore = create<RhythmState>()((set) => ({
  selectedPatternIndex: 1,
  isRunning: false,
  results: [],
  accuracy: null,
  currentSubdivision: 0,
  setPatternIndex: (index) => set({ selectedPatternIndex: index, results: [], accuracy: null, currentSubdivision: 0 }),
  setRunning: (running) => set({ isRunning: running }),
  addResult: (result) =>
    set((state) => {
      const results = [...state.results, result]
      const totalDelta = results.reduce((sum, r) => sum + Math.abs(r.deltaMs), 0)
      const avgDelta = totalDelta / results.length
      const accuracy = Math.max(0, Math.min(100, 100 - avgDelta * 2))
      return { results, accuracy }
    }),
  setCurrentSubdivision: (sub) => set({ currentSubdivision: sub }),
  reset: () => set({ results: [], accuracy: null, currentSubdivision: 0 })
}))
