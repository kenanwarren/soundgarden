import { NOTE_NAMES } from './constants'
import { INTERVALS } from './interval-data'
import type { EarTrainingMode } from '../stores/ear-training-store'

export interface Challenge {
  referenceNote: string
  referenceOctave: number
  targetNote: string
  targetOctave: number
  intervalSemitones: number
  intervalName: string
}

interface ChallengeOptions {
  allowedSemitones?: number[]
  referenceNotes?: string[]
}

export function generateChallenge(mode: EarTrainingMode, options?: ChallengeOptions): Challenge {
  const allowedNotes =
    options?.referenceNotes?.filter((note) => NOTE_NAMES.includes(note)) ?? NOTE_NAMES
  const referenceNote = allowedNotes[Math.floor(Math.random() * allowedNotes.length)]
  const referenceNoteIndex = NOTE_NAMES.indexOf(referenceNote)
  const referenceOctave = 3 + Math.floor(Math.random() * 2)

  if (mode === 'note') {
    return {
      referenceNote,
      referenceOctave,
      targetNote: referenceNote,
      targetOctave: referenceOctave,
      intervalSemitones: 0,
      intervalName: 'Unison'
    }
  }

  const availableIntervals = INTERVALS.filter(
    (i) =>
      i.semitones > 0 &&
      i.semitones <= 12 &&
      (!options?.allowedSemitones?.length || options.allowedSemitones.includes(i.semitones))
  )
  const intervalPool = availableIntervals.length
    ? availableIntervals
    : INTERVALS.filter((i) => i.semitones > 0 && i.semitones <= 12)
  const interval = intervalPool[Math.floor(Math.random() * intervalPool.length)]
  const targetIndex = (referenceNoteIndex + interval.semitones) % 12
  const targetNote = NOTE_NAMES[targetIndex]
  const targetOctave = referenceOctave + Math.floor((referenceNoteIndex + interval.semitones) / 12)

  return {
    referenceNote,
    referenceOctave,
    targetNote,
    targetOctave,
    intervalSemitones: interval.semitones,
    intervalName: interval.name
  }
}
