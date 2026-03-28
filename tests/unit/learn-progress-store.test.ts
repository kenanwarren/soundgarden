import { beforeEach, describe, expect, it } from 'vitest'
import { useLearnProgressStore } from '../../src/renderer/stores/learn-progress-store'

describe('learn-progress-store', () => {
  beforeEach(() => {
    useLearnProgressStore.setState({ progress: {}, completedSteps: {} })
  })

  it('records a session and keeps aggregate best values', () => {
    useLearnProgressStore.getState().recordSession({
      module: 'rhythm-trainer',
      title: 'Quarter-note rhythm session',
      description: 'Tracked a short rhythm session.',
      route: '/learn/rhythm',
      score: 82,
      bestStreak: 6,
      completionState: 'completed',
      weakSpots: ['Dragging 12ms'],
      patternName: 'Quarter Notes',
      accuracy: 82,
      hitCount: 12,
      missCount: 2,
      tendencyLabel: 'Dragging 12ms'
    }, 'timing-quarter-notes')

    const entry = useLearnProgressStore.getState().progress['rhythm-trainer']
    expect(entry).toBeDefined()
    expect(entry.attempts).toBe(1)
    expect(entry.bestScore).toBe(82)
    expect(entry.bestStreak).toBe(6)
    expect(entry.completionState).toBe('completed')
    expect(entry.weakSpots).toContain('Dragging 12ms')
  })

  it('marks lesson steps complete only when the recorded summary satisfies the rule', () => {
    useLearnProgressStore.getState().recordSession({
      module: 'chord-changes',
      title: 'Chord changes',
      description: 'Short loop',
      route: '/learn/chord-changes',
      score: 100,
      bestStreak: 4,
      completionState: 'completed',
      weakSpots: [],
      presetId: 'pop-four',
      presetName: 'Pop Four-Chord Loop',
      cleanSwitches: 4,
      mismatches: [],
      bpm: 84
    }, 'chord-fluency-changes')

    expect(useLearnProgressStore.getState().completedSteps['chord-fluency-changes']).toBeTypeOf('number')

    useLearnProgressStore.setState({ progress: {}, completedSteps: {} })

    useLearnProgressStore.getState().recordSession({
      module: 'chord-changes',
      title: 'Chord changes',
      description: 'Short loop',
      route: '/learn/chord-changes',
      score: 20,
      bestStreak: 1,
      completionState: 'in-progress',
      weakSpots: ['G'],
      presetId: 'open-two',
      presetName: 'Open Two-Chord Loop',
      cleanSwitches: 1,
      mismatches: ['G'],
      bpm: 80
    }, 'chord-fluency-changes')

    expect(useLearnProgressStore.getState().completedSteps['chord-fluency-changes']).toBeUndefined()
  })
})
