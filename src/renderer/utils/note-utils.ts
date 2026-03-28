import { NOTE_NAMES, DEFAULT_A4_FREQUENCY } from './constants'

export interface NoteInfo {
  note: string
  octave: number
  frequency: number
  cents: number
}

export function frequencyToNote(frequency: number, referenceA4 = DEFAULT_A4_FREQUENCY): NoteInfo {
  const semitones = 12 * Math.log2(frequency / referenceA4)
  const roundedSemitones = Math.round(semitones)
  const cents = Math.round((semitones - roundedSemitones) * 100)

  // A4 is the 57th semitone from C0 (index 0)
  const noteIndex = ((roundedSemitones % 12) + 12) % 12
  // A is index 9 in NOTE_NAMES
  const noteNameIndex = (noteIndex + 9) % 12
  const octave = Math.floor((roundedSemitones + 9) / 12) + 4

  const exactFrequency = referenceA4 * Math.pow(2, roundedSemitones / 12)

  return {
    note: NOTE_NAMES[noteNameIndex],
    octave,
    frequency: exactFrequency,
    cents
  }
}

export function noteToFrequency(
  note: string,
  octave: number,
  referenceA4 = DEFAULT_A4_FREQUENCY
): number {
  const noteIndex = NOTE_NAMES.indexOf(note)
  if (noteIndex === -1) return 0

  // Semitones from A4
  const semitonesFromA4 = noteIndex - 9 + (octave - 4) * 12

  return referenceA4 * Math.pow(2, semitonesFromA4 / 12)
}

export function formatNote(note: string, octave: number): string {
  return `${note}${octave}`
}
