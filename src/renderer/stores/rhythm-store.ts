import { create } from 'zustand'

export type HitGrade = 'perfect' | 'great' | 'good' | 'miss'
export type Sensitivity = 'low' | 'mid' | 'high'

export type TimingResult =
  | { type: 'hit'; expectedTime: number; actualTime: number; deltaMs: number }
  | { type: 'miss'; expectedTime: number }

function gradeFromDelta(deltaMs: number): HitGrade {
  const abs = Math.abs(deltaMs)
  if (abs < 15) return 'perfect'
  if (abs < 30) return 'great'
  return 'good'
}

function timingAccuracy(avgDeltaMs: number): number {
  return 100 * Math.exp(-avgDeltaMs / 45)
}

interface RhythmState {
  selectedPatternIndex: number
  isRunning: boolean
  sensitivity: Sensitivity
  results: TimingResult[]
  accuracy: number | null
  currentSubdivision: number
  hitCount: number
  missCount: number
  streak: number
  bestStreak: number
  lastHitGrade: HitGrade | null
  lastHitTime: number
  setPatternIndex: (index: number) => void
  setSensitivity: (sensitivity: Sensitivity) => void
  setRunning: (running: boolean) => void
  addResult: (result: TimingResult) => void
  setCurrentSubdivision: (sub: number) => void
  reset: () => void
}

const initialState = {
  results: [] as TimingResult[],
  accuracy: null as number | null,
  currentSubdivision: 0,
  hitCount: 0,
  missCount: 0,
  streak: 0,
  bestStreak: 0,
  lastHitGrade: null as HitGrade | null,
  lastHitTime: 0
}

export const useRhythmStore = create<RhythmState>()((set) => ({
  selectedPatternIndex: 1,
  isRunning: false,
  sensitivity: 'mid' as Sensitivity,
  ...initialState,
  setPatternIndex: (index) => set({ selectedPatternIndex: index, ...initialState }),
  setSensitivity: (sensitivity) => set({ sensitivity }),
  setRunning: (running) => set({ isRunning: running }),
  addResult: (result) =>
    set((state) => {
      const results = [...state.results, result]

      if (result.type === 'hit') {
        const hitCount = state.hitCount + 1
        const streak = state.streak + 1
        const bestStreak = Math.max(state.bestStreak, streak)
        const grade = gradeFromDelta(result.deltaMs)

        const hits = results.filter(
          (r): r is Extract<TimingResult, { type: 'hit' }> => r.type === 'hit'
        )
        const totalDelta = hits.reduce((sum, r) => sum + Math.abs(r.deltaMs), 0)
        const avgDelta = totalDelta / hits.length
        const baseAccuracy = timingAccuracy(avgDelta)
        const total = hitCount + state.missCount
        const accuracy = Math.min(100, baseAccuracy * (hitCount / total))

        return {
          results,
          hitCount,
          streak,
          bestStreak,
          accuracy,
          lastHitGrade: grade,
          lastHitTime: Date.now()
        }
      }

      // miss
      const missCount = state.missCount + 1
      const total = state.hitCount + missCount
      let accuracy: number | null = null
      if (state.hitCount > 0) {
        const hits = results.filter(
          (r): r is Extract<TimingResult, { type: 'hit' }> => r.type === 'hit'
        )
        const totalDelta = hits.reduce((sum, r) => sum + Math.abs(r.deltaMs), 0)
        const avgDelta = totalDelta / hits.length
        const baseAccuracy = timingAccuracy(avgDelta)
        accuracy = Math.min(100, baseAccuracy * (state.hitCount / total))
      } else {
        accuracy = 0
      }

      return {
        results,
        missCount,
        accuracy,
        streak: 0,
        lastHitGrade: 'miss' as HitGrade,
        lastHitTime: Date.now()
      }
    }),
  setCurrentSubdivision: (sub) => set({ currentSubdivision: sub }),
  reset: () => set(initialState)
}))
