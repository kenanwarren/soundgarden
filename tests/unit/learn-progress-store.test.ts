import { beforeEach, describe, expect, it } from 'vitest'
import {
  migrateLearnProgressState,
  useLearnProgressStore
} from '../../src/renderer/stores/learn-progress-store'

describe('learn-progress-store', () => {
  beforeEach(() => {
    useLearnProgressStore.setState({ progress: {}, completedSteps: {} })
  })

  it('records a session and keeps aggregate best values', () => {
    useLearnProgressStore.getState().recordSession(
      {
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
      },
      'timing-quarter-notes'
    )

    const entry = useLearnProgressStore.getState().progress['rhythm-trainer']
    expect(entry).toBeDefined()
    expect(entry.attempts).toBe(1)
    expect(entry.bestScore).toBe(82)
    expect(entry.bestStreak).toBe(6)
    expect(entry.completionState).toBe('completed')
    expect(entry.weakSpots).toContain('Dragging 12ms')
  })

  it('preserves best score, best streak, and completed state across weaker follow-up sessions', () => {
    const store = useLearnProgressStore.getState()

    store.recordSession(
      {
        module: 'ear-training',
        title: 'Note ear session',
        description: 'Started with a strong note-recognition round.',
        route: '/learn/ear-training',
        score: 90,
        bestStreak: 5,
        completionState: 'completed',
        weakSpots: ['Bb'],
        mode: 'note',
        accuracy: 90,
        correct: 9,
        total: 10,
        missedTargets: ['Bb']
      },
      'foundations-ear-note'
    )

    store.recordSession(
      {
        module: 'ear-training',
        title: 'Interval ear session',
        description: 'Follow-up round with weaker interval recall.',
        route: '/learn/ear-training',
        score: 45,
        bestStreak: 2,
        completionState: 'in-progress',
        weakSpots: ['Perfect 5th'],
        mode: 'interval',
        accuracy: 45,
        correct: 2,
        total: 5,
        missedTargets: ['Perfect 5th']
      },
      'blues-call-response'
    )

    const entry = useLearnProgressStore.getState().progress['ear-training']
    expect(entry.attempts).toBe(2)
    expect(entry.bestScore).toBe(90)
    expect(entry.bestStreak).toBe(5)
    expect(entry.completionState).toBe('completed')
    expect(entry.weakSpots).toEqual(expect.arrayContaining(['Bb', 'Perfect 5th']))
  })

  it('marks lesson steps complete only when the recorded summary satisfies the rule', () => {
    useLearnProgressStore.getState().recordSession(
      {
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
      },
      'chord-fluency-changes'
    )

    expect(useLearnProgressStore.getState().completedSteps['chord-fluency-changes']).toBeTypeOf(
      'number'
    )

    useLearnProgressStore.setState({ progress: {}, completedSteps: {} })

    useLearnProgressStore.getState().recordSession(
      {
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
      },
      'chord-fluency-changes'
    )

    expect(useLearnProgressStore.getState().completedSteps['chord-fluency-changes']).toBeUndefined()
  })

  it('requires matching sequence requirements before marking scale-sequence steps complete', () => {
    const store = useLearnProgressStore.getState()

    store.recordSession(
      {
        module: 'scale-sequences',
        title: 'G Major Pentatonic descending sequence',
        description: 'Completed the requested descending loops.',
        route: '/learn/scale-sequences',
        score: 100,
        bestStreak: 10,
        completionState: 'completed',
        weakSpots: [],
        root: 'G',
        scaleName: 'Major Pentatonic',
        sequenceType: 'descending',
        loopsCompleted: 2,
        targetLoops: 2,
        missedNotes: []
      },
      'country-pentatonic-step'
    )

    expect(useLearnProgressStore.getState().completedSteps['country-pentatonic-step']).toBeTypeOf(
      'number'
    )

    useLearnProgressStore.setState({ progress: {}, completedSteps: {} })

    useLearnProgressStore.getState().recordSession(
      {
        module: 'scale-sequences',
        title: 'G Major Pentatonic ascending sequence',
        description: 'Played enough loops, but with the wrong sequence type.',
        route: '/learn/scale-sequences',
        score: 100,
        bestStreak: 10,
        completionState: 'completed',
        weakSpots: [],
        root: 'G',
        scaleName: 'Major Pentatonic',
        sequenceType: 'ascending',
        loopsCompleted: 2,
        targetLoops: 2,
        missedNotes: []
      },
      'country-pentatonic-step'
    )

    expect(
      useLearnProgressStore.getState().completedSteps['country-pentatonic-step']
    ).toBeUndefined()
  })

  it('migrates legacy summaries to include resumeHref defaults', () => {
    const migrated = migrateLearnProgressState(
      {
        progress: {
          'scale-explorer': {
            id: 'scale-explorer',
            attempts: 1,
            lastPracticedAt: 1_700_000_000_000,
            bestScore: 91,
            bestStreak: 12,
            completionState: 'completed',
            weakSpots: [],
            lastSession: {
              module: 'scale-explorer',
              title: 'A blues scale session',
              description: 'Covered the A blues box.',
              route: '/learn/scales',
              score: 91,
              bestStreak: 12,
              completionState: 'completed',
              weakSpots: [],
              notesHit: 6,
              totalNotes: 6,
              timeSpentMs: 52_000,
              missedNotes: [],
              root: 'A',
              scaleName: 'Blues'
            }
          }
        },
        completedSteps: {}
      },
      0
    )

    expect(migrated.progress?.['scale-explorer']?.lastSession?.resumeHref).toBe('/learn/scales')
  })
})
