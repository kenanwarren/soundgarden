import type { ChordVoicing } from './chord-voicings'

export type ScaleSequenceType = 'ascending' | 'descending' | 'thirds'

export function buildScaleSequence(
  scaleNotes: string[],
  sequenceType: ScaleSequenceType
): string[] {
  if (sequenceType === 'ascending') return [...scaleNotes]
  if (sequenceType === 'descending') return [...scaleNotes].reverse()

  const sequence: string[] = []
  for (let index = 0; index < scaleNotes.length - 2; index++) {
    sequence.push(scaleNotes[index], scaleNotes[index + 2])
  }
  return sequence.length > 0 ? sequence : [...scaleNotes]
}

export function matchesChordVoicing(
  target: Pick<ChordVoicing, 'root' | 'quality'>,
  detected: { root: string; quality: string } | null
): boolean {
  if (!detected) return false
  return detected.root === target.root && detected.quality === target.quality
}
