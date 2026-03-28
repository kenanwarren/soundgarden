import { useCallback, useEffect, useRef, useState } from 'react'
import { useChordStore } from '../stores/chord-store'
import { useChordDetection } from './useChordDetection'

export function useChordPractice(targetRoot?: string, targetQuality?: string) {
  const { start: baseStart, stop, isActive } = useChordDetection()
  const currentChord = useChordStore((s) => s.currentChord)
  const tickCount = useChordStore((s) => s.tickCount)
  const peakDb = useChordStore((s) => s.peakDb)
  const [cleanMatchCount, setCleanMatchCount] = useState(0)
  const [mismatchCount, setMismatchCount] = useState(0)
  const [mismatches, setMismatches] = useState<string[]>([])
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
    if (
      currentChord.name === lastRegisteredName.current &&
      now - lastRegisteredAt.current < 1200
    ) {
      return
    }

    lastRegisteredAt.current = now
    lastRegisteredName.current = currentChord.name

    if (isMatch) {
      setCleanMatchCount((count) => count + 1)
      return
    }

    setMismatchCount((count) => count + 1)
    setMismatches((current) =>
      current.includes(currentChord.name) ? current : [...current, currentChord.name].slice(0, 5)
    )
  }, [currentChord, isActive, isMatch, peakDb, tickCount])

  const start = useCallback(() => {
    setCleanMatchCount(0)
    setMismatchCount(0)
    setMismatches([])
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
