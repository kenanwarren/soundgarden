// @vitest-environment jsdom

import React from 'react'
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { LearnHub } from '../../src/renderer/components/learn/LearnHub'
import { useSystemStatus } from '../../src/renderer/hooks/useSystemStatus'
import { useLearnProgressStore } from '../../src/renderer/stores/learn-progress-store'
import { renderWithRouter } from './render-with-router'

vi.mock('../../src/renderer/hooks/useSystemStatus', () => ({
  useSystemStatus: vi.fn()
}))

const connectedStatus = {
  permissionState: 'granted',
  isConnected: true,
  inputDeviceId: 'input-1',
  inputDeviceLabel: 'Interface',
  outputDeviceId: 'output-1',
  outputDeviceLabel: 'Speakers',
  inputLevel: 0.3,
  signalBand: 'healthy',
  signalLabel: 'Healthy',
  latencyMs: 12,
  latencyBand: 'good',
  latencyLabel: 'Good (12.0ms)',
  activeMode: 'Idle',
  lastRecoverableError: null,
  devicesLoading: false
} as const

const disconnectedStatus = {
  ...connectedStatus,
  isConnected: false,
  inputDeviceId: null,
  inputDeviceLabel: 'No input selected',
  signalBand: 'silent',
  signalLabel: 'No signal',
  latencyMs: null,
  latencyBand: 'n/a',
  latencyLabel: 'Connect input to measure latency'
} as const

const mockUseSystemStatus = vi.mocked(useSystemStatus)

describe('LearnHub', () => {
  beforeEach(() => {
    localStorage.clear()
    useLearnProgressStore.getState().reset()
    mockUseSystemStatus.mockReturnValue(connectedStatus)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('keeps overview short, then exposes path filtering and tools behind dedicated views', () => {
    useLearnProgressStore.setState({
      progress: {
        'scale-explorer': {
          id: 'scale-explorer',
          attempts: 1,
          lastPracticedAt: Date.now(),
          bestScore: 82,
          bestStreak: 5,
          completionState: 'in-progress',
          weakSpots: ['Blue note timing'],
          lastSession: {
            module: 'scale-explorer',
            title: 'A blues scale session',
            description: 'Covered the A blues box.',
            route: '/learn/scales',
            score: 82,
            bestStreak: 5,
            completionState: 'in-progress',
            weakSpots: ['Blue note timing'],
            notesHit: 5,
            totalNotes: 6,
            timeSpentMs: 45000,
            missedNotes: ['Eb'],
            root: 'A',
            scaleName: 'Blues'
          }
        }
      }
    })

    renderWithRouter(<LearnHub />)

    expect(screen.getByText('Resume where you left off')).toBeInTheDocument()
    expect(screen.queryByText('All Learning Paths')).not.toBeInTheDocument()
    expect(screen.queryByText('Quick lookup still lives here.')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Explore' }))
    fireEvent.click(screen.getByRole('button', { name: 'By skill' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fingerstyle' }))

    expect(screen.getByText('Fingerstyle Paths')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Use alternating bass and arpeggio patterns to build steady fingerstyle motion.'
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByText(
        'Build shuffle feel, dominant changes, blues-box motion, and ear-led response.'
      )
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tools' }))
    expect(screen.getByText('Open a direct learning tool')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Chord Library/i })).toBeInTheDocument()
  })

  it('shows blocked guided guidance on overview and keeps secondary navigation available offline', () => {
    mockUseSystemStatus.mockReturnValue(disconnectedStatus)

    renderWithRouter(<LearnHub />)

    expect(
      screen.getByText(/Guided audio steps will unlock once your input is connected/i)
    ).toBeInTheDocument()
    expect(screen.getAllByText('Connect input').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Explore all paths' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Browse tools' })).toBeInTheDocument()
  })

  it('restores learn subview and filters from the URL search params', () => {
    renderWithRouter(<LearnHub />, '/learn?view=explore&browse=skill&skill=fingerstyle')

    expect(screen.getByText('Fingerstyle Paths')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Explore' })).toHaveClass('bg-emerald-600')
    expect(screen.getByRole('button', { name: 'By skill' })).toHaveClass('bg-emerald-600')
    expect(screen.getByRole('button', { name: 'Fingerstyle' })).toHaveClass('bg-emerald-600')
  })
})
