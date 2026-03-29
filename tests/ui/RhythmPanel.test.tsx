// @vitest-environment jsdom

import React from 'react'
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { RhythmPanel } from '../../src/renderer/components/learn/RhythmPanel'
import { useRhythmStore } from '../../src/renderer/stores/rhythm-store'
import { useMetronomeStore } from '../../src/renderer/stores/metronome-store'
import { renderWithRouter } from './render-with-router'

const rhythmTrainerMocks = vi.hoisted(() => ({
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn()
}))

const metronomeMocks = vi.hoisted(() => ({
  tap: vi.fn()
}))

vi.mock('../../src/renderer/hooks/useRhythmTrainer', () => ({
  useRhythmTrainer: () => ({
    start: rhythmTrainerMocks.start,
    stop: rhythmTrainerMocks.stop,
    isConnected: true
  })
}))

vi.mock('../../src/renderer/hooks/useMetronome', () => ({
  useMetronome: () => ({
    tap: metronomeMocks.tap
  })
}))

describe('RhythmPanel', () => {
  beforeEach(() => {
    localStorage.clear()
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
      lastHitTime: 0
    })
    useMetronomeStore.setState({
      bpm: 120,
      beatsPerMeasure: 4,
      isPlaying: false,
      currentBeat: 0,
      accentFirst: true
    })
    rhythmTrainerMocks.start.mockClear()
    rhythmTrainerMocks.stop.mockClear()
    metronomeMocks.tap.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('applies starter drill query params and highlights matching rhythm patterns', async () => {
    renderWithRouter(<RhythmPanel />, '/learn/rhythm?pattern=shuffle&genre=blues')

    await waitFor(() => {
      expect(screen.getAllByText('Shuffle').length).toBeGreaterThan(0)
    })

    expect(screen.getByText(/Highlighting patterns tagged for blues practice/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Shuffle Swing feel with triplet subdivision/i })
    ).toHaveClass('bg-emerald-600')

    fireEvent.click(screen.getByRole('button', { name: 'Start Trainer' }))

    expect(rhythmTrainerMocks.start).toHaveBeenCalledTimes(1)
  })
})
