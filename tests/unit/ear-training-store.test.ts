import { describe, it, expect, beforeEach } from 'vitest'
import { useEarTrainingStore } from '../../src/renderer/stores/ear-training-store'

describe('ear-training-store', () => {
  beforeEach(() => {
    useEarTrainingStore.setState({
      mode: 'note',
      challengePresetId: null,
      currentChallenge: null,
      isListening: false,
      score: 0,
      streak: 0,
      bestStreak: 0,
      total: 0,
      missedTargets: [],
      lastResult: null
    })
  })

  it('has correct initial state', () => {
    const state = useEarTrainingStore.getState()
    expect(state.mode).toBe('note')
    expect(state.challengePresetId).toBeNull()
    expect(state.score).toBe(0)
    expect(state.streak).toBe(0)
    expect(state.bestStreak).toBe(0)
    expect(state.total).toBe(0)
    expect(state.missedTargets).toEqual([])
    expect(state.lastResult).toBeNull()
    expect(state.currentChallenge).toBeNull()
    expect(state.isListening).toBe(false)
  })

  it('recordResult(true) increments score, streak, and total', () => {
    useEarTrainingStore.getState().recordResult(true)
    const state = useEarTrainingStore.getState()
    expect(state.score).toBe(1)
    expect(state.streak).toBe(1)
    expect(state.bestStreak).toBe(1)
    expect(state.total).toBe(1)
    expect(state.lastResult).toBe('correct')
  })

  it('recordResult(false) resets streak but increments total', () => {
    useEarTrainingStore.getState().recordResult(true)
    useEarTrainingStore.getState().recordResult(true)
    useEarTrainingStore.getState().recordResult(false, 'Perfect fifth')
    const state = useEarTrainingStore.getState()
    expect(state.score).toBe(2)
    expect(state.streak).toBe(0)
    expect(state.bestStreak).toBe(2)
    expect(state.total).toBe(3)
    expect(state.missedTargets).toEqual(['Perfect fifth'])
    expect(state.lastResult).toBe('incorrect')
  })

  it('streak builds on consecutive correct answers', () => {
    const { recordResult } = useEarTrainingStore.getState()
    recordResult(true)
    recordResult(true)
    recordResult(true)
    expect(useEarTrainingStore.getState().streak).toBe(3)
  })

  it('setMode resets all scores', () => {
    useEarTrainingStore.getState().recordResult(true)
    useEarTrainingStore.getState().recordResult(true)
    useEarTrainingStore.getState().setChallengePresetId('blues-call-response')
    useEarTrainingStore.getState().setMode('interval')
    const state = useEarTrainingStore.getState()
    expect(state.mode).toBe('interval')
    expect(state.challengePresetId).toBeNull()
    expect(state.score).toBe(0)
    expect(state.streak).toBe(0)
    expect(state.bestStreak).toBe(0)
    expect(state.total).toBe(0)
    expect(state.missedTargets).toEqual([])
    expect(state.lastResult).toBeNull()
    expect(state.currentChallenge).toBeNull()
  })

  it('reset clears scores but preserves mode', () => {
    useEarTrainingStore.getState().setMode('interval')
    useEarTrainingStore.getState().recordResult(true)
    useEarTrainingStore.getState().reset()
    const state = useEarTrainingStore.getState()
    expect(state.mode).toBe('interval')
    expect(state.score).toBe(0)
    expect(state.streak).toBe(0)
    expect(state.bestStreak).toBe(0)
    expect(state.total).toBe(0)
    expect(state.missedTargets).toEqual([])
  })

  it('setChallenge clears listening and lastResult', () => {
    useEarTrainingStore.getState().setListening(true)
    useEarTrainingStore.getState().recordResult(true)
    useEarTrainingStore.getState().setChallenge({
      referenceNote: 'C',
      referenceOctave: 4,
      targetNote: 'C',
      targetOctave: 4,
      intervalSemitones: 0,
      intervalName: 'Unison'
    })
    const state = useEarTrainingStore.getState()
    expect(state.isListening).toBe(false)
    expect(state.lastResult).toBeNull()
    expect(state.currentChallenge).not.toBeNull()
  })

  it('recordResult sets isListening to false', () => {
    useEarTrainingStore.getState().setListening(true)
    useEarTrainingStore.getState().recordResult(true)
    expect(useEarTrainingStore.getState().isListening).toBe(false)
  })

  it('setChallengePresetId preserves the active mode but clears the active prompt state', () => {
    useEarTrainingStore.getState().setMode('interval')
    useEarTrainingStore.getState().setChallenge({
      referenceNote: 'C',
      referenceOctave: 4,
      targetNote: 'G',
      targetOctave: 4,
      intervalSemitones: 7,
      intervalName: 'Perfect Fifth'
    })
    useEarTrainingStore.getState().setListening(true)
    useEarTrainingStore.getState().setChallengePresetId('rock-riff-intervals')

    const state = useEarTrainingStore.getState()
    expect(state.mode).toBe('interval')
    expect(state.challengePresetId).toBe('rock-riff-intervals')
    expect(state.currentChallenge).toBeNull()
    expect(state.isListening).toBe(false)
  })
})
