import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useChordStore } from '../stores/chord-store'
import { useChordDetection } from './useChordDetection'

interface PracticeState {
  cleanMatchCount: number
  mismatchCount: number
  mismatches: string[]
}

type PracticeAction =
  | { type: 'reset' }
  | { type: 'match' }
  | { type: 'mismatch'; chordName: string }

const INITIAL_STATE: PracticeState = {
  cleanMatchCount: 0,
  mismatchCount: 0,
  mismatches: []
}

function reducer(state: PracticeState, action: PracticeAction): PracticeState {
  switch (action.type) {
    case 'reset':
      return INITIAL_STATE
    case 'match':
      return {
        ...state,
        cleanMatchCount: state.cleanMatchCount + 1
      }
    case 'mismatch':
      return {
        cleanMatchCount: state.cleanMatchCount,
        mismatchCount: state.mismatchCount + 1,
        mismatches: state.mismatches.includes(action.chordName)
          ? state.mismatches
          : [...state.mismatches, action.chordName].slice(0, 5)
      }
  }
}

export function useChordPractice(targetRoot?: string, targetQuality?: string) {
  const { start: baseStart, stop, isActive } = useChordDetection()
  const currentChord = useChordStore((s) => s.currentChord)
  const tickCount = useChordStore((s) => s.tickCount)
  const peakDb = useChordStore((s) => s.peakDb)
  const [{ cleanMatchCount, mismatchCount, mismatches }, dispatch] = useReducer(
    reducer,
    INITIAL_STATE
  )
  const lastRegisteredAt = useRef(0)
  const lastRegisteredName = useRef<string | null>(null)

  const isMatch =
    currentChord &&
    targetRoot &&
    targetQuality &&
    currentChord.root === targetRoot &&
    currentChord.quality === targetQuality

  useEffect(() => {
    if (!isActive || !currentChord || peakDb < -70) return

    const now = Date.now()
    if (currentChord.name === lastRegisteredName.current && now - lastRegisteredAt.current < 1200) {
      return
    }

    lastRegisteredAt.current = now
    lastRegisteredName.current = currentChord.name

    if (isMatch) {
      dispatch({ type: 'match' })
      return
    }

    dispatch({ type: 'mismatch', chordName: currentChord.name })
  }, [currentChord, isActive, isMatch, peakDb, tickCount])

  const start = useCallback(() => {
    dispatch({ type: 'reset' })
    lastRegisteredAt.current = 0
    lastRegisteredName.current = null
    baseStart()
  }, [baseStart])

  return {
    start,
    stop,
    isActive,
    currentChord,
    isMatch: !!isMatch,
    cleanMatchCount,
    mismatchCount,
    mismatches
  }
}
