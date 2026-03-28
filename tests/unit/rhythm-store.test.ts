import { describe, it, expect, beforeEach } from 'vitest'
import { useRhythmStore } from '../../src/renderer/stores/rhythm-store'

function resetStore() {
  useRhythmStore.setState({
    selectedPatternIndex: 1,
    isRunning: false,
    sensitivity: 'mid',
    results: [],
    accuracy: null,
    currentSubdivision: 0,
    hitCount: 0,
    missCount: 0,
    streak: 0,
    bestStreak: 0,
    lastHitGrade: null,
    lastHitTime: 0,
  })
}

function hit(deltaMs: number, expectedTime = 1.0) {
  useRhythmStore.getState().addResult({
    type: 'hit',
    expectedTime,
    actualTime: expectedTime + deltaMs / 1000,
    deltaMs,
  })
}

function miss(expectedTime = 1.0) {
  useRhythmStore.getState().addResult({ type: 'miss', expectedTime })
}

describe('rhythm-store', () => {
  beforeEach(resetStore)

  it('has correct initial state', () => {
    const state = useRhythmStore.getState()
    expect(state.selectedPatternIndex).toBe(1)
    expect(state.isRunning).toBe(false)
    expect(state.results).toEqual([])
    expect(state.accuracy).toBeNull()
    expect(state.hitCount).toBe(0)
    expect(state.missCount).toBe(0)
    expect(state.streak).toBe(0)
    expect(state.bestStreak).toBe(0)
  })

  it('addResult computes accuracy from average delta', () => {
    hit(10)
    const state = useRhythmStore.getState()
    expect(state.results).toHaveLength(1)
    // baseAccuracy = 100 - 10*2 = 80, hitRate = 1/1, accuracy = 80
    expect(state.accuracy).toBe(80)
  })

  it('accuracy decreases with worse timing', () => {
    hit(40)
    // baseAccuracy = 100 - 40*2 = 20
    expect(useRhythmStore.getState().accuracy).toBe(20)
  })

  it('accuracy is clamped to 0', () => {
    hit(100)
    expect(useRhythmStore.getState().accuracy).toBe(0)
  })

  it('accuracy averages across multiple hits', () => {
    hit(10, 1.0)
    hit(20, 2.0)
    // avgDelta = 15, baseAccuracy = 70, hitRate = 2/2 = 1, accuracy = 70
    expect(useRhythmStore.getState().accuracy).toBe(70)
  })

  it('setPatternIndex resets all state', () => {
    hit(10)
    useRhythmStore.getState().setPatternIndex(3)
    const state = useRhythmStore.getState()
    expect(state.selectedPatternIndex).toBe(3)
    expect(state.results).toEqual([])
    expect(state.accuracy).toBeNull()
    expect(state.hitCount).toBe(0)
    expect(state.missCount).toBe(0)
    expect(state.streak).toBe(0)
  })

  it('reset clears results but keeps pattern', () => {
    useRhythmStore.getState().setPatternIndex(5)
    hit(10)
    useRhythmStore.getState().reset()
    const state = useRhythmStore.getState()
    expect(state.selectedPatternIndex).toBe(5)
    expect(state.results).toEqual([])
    expect(state.accuracy).toBeNull()
  })

  it('handles negative deltaMs (early hits)', () => {
    hit(-10)
    expect(useRhythmStore.getState().accuracy).toBe(80)
  })

  it('perfect timing gives 100% accuracy', () => {
    hit(0)
    expect(useRhythmStore.getState().accuracy).toBe(100)
  })

  describe('misses', () => {
    it('miss sets accuracy to 0 with no hits', () => {
      miss()
      const state = useRhythmStore.getState()
      expect(state.missCount).toBe(1)
      expect(state.accuracy).toBe(0)
    })

    it('misses penalize accuracy multiplicatively', () => {
      hit(10, 1.0)
      miss(2.0)
      const state = useRhythmStore.getState()
      // baseAccuracy = 80 (from 10ms avg), hitRate = 1/2 = 0.5
      // accuracy = 80 * 0.5 = 40
      expect(state.accuracy).toBe(40)
      expect(state.hitCount).toBe(1)
      expect(state.missCount).toBe(1)
    })

    it('multiple misses compound the penalty', () => {
      hit(0, 1.0)
      miss(2.0)
      miss(3.0)
      // baseAccuracy = 100, hitRate = 1/3
      // accuracy = 100 * (1/3) ≈ 33.33
      expect(Math.round(useRhythmStore.getState().accuracy!)).toBe(33)
    })
  })

  describe('streaks', () => {
    it('increments streak on consecutive hits', () => {
      hit(10, 1.0)
      hit(15, 2.0)
      hit(5, 3.0)
      const state = useRhythmStore.getState()
      expect(state.streak).toBe(3)
      expect(state.bestStreak).toBe(3)
    })

    it('resets streak on miss', () => {
      hit(10, 1.0)
      hit(15, 2.0)
      miss(3.0)
      const state = useRhythmStore.getState()
      expect(state.streak).toBe(0)
      expect(state.bestStreak).toBe(2)
    })

    it('tracks best streak across multiple runs', () => {
      hit(10, 1.0)
      hit(10, 2.0)
      hit(10, 3.0)
      miss(4.0)
      hit(10, 5.0)
      const state = useRhythmStore.getState()
      expect(state.streak).toBe(1)
      expect(state.bestStreak).toBe(3)
    })
  })

  describe('hit grades', () => {
    it('perfect for <15ms', () => {
      hit(10)
      expect(useRhythmStore.getState().lastHitGrade).toBe('perfect')
    })

    it('great for 15-30ms', () => {
      hit(20)
      expect(useRhythmStore.getState().lastHitGrade).toBe('great')
    })

    it('good for 30-50ms', () => {
      hit(35)
      expect(useRhythmStore.getState().lastHitGrade).toBe('good')
    })

    it('miss grade on missed beat', () => {
      miss()
      expect(useRhythmStore.getState().lastHitGrade).toBe('miss')
    })
  })
})
