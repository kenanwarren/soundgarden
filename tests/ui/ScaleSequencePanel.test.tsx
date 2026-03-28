// @vitest-environment jsdom

import React from 'react'
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { ScaleSequencePanel } from '../../src/renderer/components/learn/ScaleSequencePanel'
import { useLearnProgressStore } from '../../src/renderer/stores/learn-progress-store'
import { renderWithRouter } from './render-with-router'

const pitchDetectionMocks = vi.hoisted(() => ({
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn()
}))

vi.mock('../../src/renderer/hooks/usePitchDetection', () => ({
  usePitchDetection: () => ({
    start: pitchDetectionMocks.start,
    stop: pitchDetectionMocks.stop,
    isConnected: true
  })
}))

vi.mock('../../src/renderer/components/common/Fretboard', () => ({
  Fretboard: () => <div data-testid="fretboard">Fretboard</div>
}))

describe('ScaleSequencePanel', () => {
  beforeEach(() => {
    localStorage.clear()
    useLearnProgressStore.getState().reset()
    pitchDetectionMocks.start.mockClear()
    pitchDetectionMocks.stop.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('loads genre sequence prefills from the lesson route and starts practice with the mocked detector', async () => {
    renderWithRouter(<ScaleSequencePanel />, '/learn/scale-sequences?lesson=funk-mixolydian-step')

    await waitFor(() => {
      expect(screen.getByText('A Mixolydian')).toBeInTheDocument()
    })

    expect(screen.getAllByText(/Mixolydian Pocket/).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'thirds' })).toHaveClass('bg-emerald-600')
    expect(screen.getByTestId('fretboard')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Start Practice' }))

    expect(pitchDetectionMocks.start).toHaveBeenCalledTimes(1)
  })
})
