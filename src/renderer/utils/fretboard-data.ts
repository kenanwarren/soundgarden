import { NOTE_NAMES, TUNING_PRESETS } from './constants'

export interface FretPosition {
  string: number
  fret: number
  note: string
  octave: number
}

const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Fb: 'E',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B'
}

function parseTuningNote(noteStr: string): { note: string; octave: number } {
  const match = noteStr.match(/^([A-G][b#]?)(\d+)$/)
  if (!match) return { note: 'E', octave: 2 }
  let note = match[1]
  if (FLAT_TO_SHARP[note]) note = FLAT_TO_SHARP[note]
  return { note, octave: parseInt(match[2]) }
}

export function getFretNote(
  stringIndex: number,
  fret: number,
  tuning: string[] = TUNING_PRESETS.Standard
): FretPosition {
  const open = parseTuningNote(tuning[stringIndex])
  const openSemitone = NOTE_NAMES.indexOf(open.note) + open.octave * 12
  const totalSemitone = openSemitone + fret
  const note = NOTE_NAMES[totalSemitone % 12]
  const octave = Math.floor(totalSemitone / 12)
  return { string: stringIndex, fret, note, octave }
}

export function getScalePositions(
  scaleNotes: string[],
  tuning: string[] = TUNING_PRESETS.Standard,
  maxFret = 15
): FretPosition[] {
  const noteSet = new Set(scaleNotes)
  const positions: FretPosition[] = []
  for (let s = 0; s < tuning.length; s++) {
    for (let f = 0; f <= maxFret; f++) {
      const pos = getFretNote(s, f, tuning)
      if (noteSet.has(pos.note)) {
        positions.push(pos)
      }
    }
  }
  return positions
}
