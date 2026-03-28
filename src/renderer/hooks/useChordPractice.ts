import { useChordStore } from '../stores/chord-store'
import { useChordDetection } from './useChordDetection'

export function useChordPractice(targetRoot?: string, targetQuality?: string) {
  const { start, stop, isActive } = useChordDetection()
  const currentChord = useChordStore((s) => s.currentChord)

  const isMatch =
    currentChord &&
    targetRoot &&
    targetQuality &&
    currentChord.root === targetRoot &&
    currentChord.quality === targetQuality

  return { start, stop, isActive, currentChord, isMatch: !!isMatch }
}
