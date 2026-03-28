// @vitest-environment jsdom

import React from 'react'
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { ChordChangesPanel } from '../../src/renderer/components/learn/ChordChangesPanel'
import { useChordStore } from '../../src/renderer/stores/chord-store'
import { useLearnProgressStore } from '../../src/renderer/stores/learn-progress-store'
import { useMetronomeStore } from '../../src/renderer/stores/metronome-store'
import { renderWithRouter } from './render-with-router'

const chordDetectionMocks = vi.hoisted(() => ({
  start: vi.fn(),
  stop: vi.fn()
}))

const metronomeMocks = vi.hoisted(() => ({
  tap: vi.fn(),
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn()
}))

vi.mock('../../src/renderer/hooks/useChordDetection', () => ({
  useChordDetection: () => ({
    start: chordDetectionMocks.start,
    stop: chordDetectionMocks.stop,
    isConnected: true
  })
}))

vi.mock('../../src/renderer/hooks/useMetronome', () => ({
  useMetronome: () => ({
    tap: metronomeMocks.tap,
    start: metronomeMocks.start,
    stop: metronomeMocks.stop
  })
}))

vi.mock('../../src/renderer/components/common/ChordDiagram', () => ({
  ChordDiagram: ({ voicing }: { voicing: { name: string } }) => <div>{voicing.name}</div>
}))

describe('ChordChangesPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    useLearnProgressStore.getState().reset()
    useChordStore.setState({ isActive: false, currentChord: null, chromagram: null, tickCount: 0, peakDb: -Infinity })
    useMetronomeStore.setState({
      bpm: 120,
      beatsPerMeasure: 4,
      isPlaying: false,
      currentBeat: 0,
      accentFirst: true
    })
    chordDetectionMocks.start.mockClear()
    chordDetectionMocks.stop.mockClear()
    metronomeMocks.tap.mockClear()
    metronomeMocks.start.mockClear()
    metronomeMocks.stop.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('applies guided chord-change prefills from the lesson route and starts the trainer', async () => {
    renderWithRouter(<ChordChangesPanel />, '/learn/chord-changes?lesson=rock-power-changes')

    await waitFor(() => {
      expect(screen.getAllByDisplayValue('94')).toHaveLength(2)
    })

    expect(screen.getByText(/Power Stack Changes/)).toBeInTheDocument()
    expect(screen.getAllByText('E5').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Start Trainer' }))

    expect(chordDetectionMocks.start).toHaveBeenCalledTimes(1)
    expect(metronomeMocks.start).toHaveBeenCalledTimes(1)
  })
})
