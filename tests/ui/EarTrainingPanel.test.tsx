// @vitest-environment jsdom

import React from 'react'
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { EarTrainingPanel } from '../../src/renderer/components/learn/EarTrainingPanel'
import { useEarTrainingStore } from '../../src/renderer/stores/ear-training-store'
import { useLearnProgressStore } from '../../src/renderer/stores/learn-progress-store'
import { renderWithRouter } from './render-with-router'

const earTrainingMocks = vi.hoisted(() => ({
  newRound: vi.fn().mockResolvedValue(undefined),
  playChallenge: vi.fn().mockResolvedValue(undefined),
  listen: vi.fn().mockResolvedValue(undefined),
  stopListening: vi.fn()
}))

vi.mock('../../src/renderer/hooks/useEarTraining', () => ({
  useEarTraining: () => ({
    newRound: earTrainingMocks.newRound,
    playChallenge: earTrainingMocks.playChallenge,
    listen: earTrainingMocks.listen,
    stopListening: earTrainingMocks.stopListening,
    isConnected: true
  })
}))

describe('EarTrainingPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    useLearnProgressStore.getState().reset()
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
    earTrainingMocks.newRound.mockClear()
    earTrainingMocks.playChallenge.mockClear()
    earTrainingMocks.listen.mockClear()
    earTrainingMocks.stopListening.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('applies guided ear-training prefills from the lesson route and starts a round', async () => {
    renderWithRouter(<EarTrainingPanel />, '/learn/ear-training?lesson=blues-call-response')

    await waitFor(() => {
      expect(useEarTrainingStore.getState().mode).toBe('interval')
      expect(useEarTrainingStore.getState().challengePresetId).toBe('blues-call-response')
    })

    expect(screen.getByText(/Call & Response Ear/)).toBeInTheDocument()
    expect(
      screen.getAllByText(/Listen for blue-third and dominant-color movement/).length
    ).toBeGreaterThan(0)
    expect(screen.getByText('Interval').closest('button')).toHaveClass('bg-emerald-600')

    fireEvent.click(screen.getByRole('button', { name: /Start Round/i }))

    expect(earTrainingMocks.newRound).toHaveBeenCalledTimes(1)
  })
})
