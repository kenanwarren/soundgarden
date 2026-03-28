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

export function generateChallenge(mode: EarTrainingMode): Challenge {
  const referenceNoteIndex = Math.floor(Math.random() * 12)
  const referenceOctave = 3 + Math.floor(Math.random() * 2)
  const referenceNote = NOTE_NAMES[referenceNoteIndex]

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

  const availableIntervals = INTERVALS.filter((i) => i.semitones > 0 && i.semitones <= 12)
  const interval = availableIntervals[Math.floor(Math.random() * availableIntervals.length)]
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
