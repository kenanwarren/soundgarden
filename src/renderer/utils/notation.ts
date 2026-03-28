import type {
  NoteDuration,
  NotationMeasure,
  NotationNote,
  SongDefinition,
  SongNotation
} from './learn-types'

const NOTE_DURATION_UNITS: Record<NoteDuration, number> = {
  whole: 32,
  half: 16,
  quarter: 8,
  eighth: 4,
  sixteenth: 2,
  thirtySecond: 1
}

const REST_FILL_SPECS: Array<{ duration: NoteDuration; dotted?: boolean; units: number }> = [
  { duration: 'whole', dotted: true, units: 48 },
  { duration: 'whole', units: 32 },
  { duration: 'half', dotted: true, units: 24 },
  { duration: 'half', units: 16 },
  { duration: 'quarter', dotted: true, units: 12 },
  { duration: 'quarter', units: 8 },
  { duration: 'eighth', dotted: true, units: 6 },
  { duration: 'eighth', units: 4 },
  { duration: 'sixteenth', dotted: true, units: 3 },
  { duration: 'sixteenth', units: 2 },
  { duration: 'thirtySecond', units: 1 }
]

export function getNoteDurationUnits(note: Pick<NotationNote, 'duration' | 'dotted'>): number {
  const baseUnits = NOTE_DURATION_UNITS[note.duration]
  return note.dotted ? baseUnits + baseUnits / 2 : baseUnits
}

export function getMeasureDurationUnits(measure: Pick<NotationMeasure, 'notes'>): number {
  return measure.notes.reduce((total, note) => total + getNoteDurationUnits(note), 0)
}

export function getMeasureDurationBeats(measure: Pick<NotationMeasure, 'notes'>): number {
  return getMeasureDurationUnits(measure) / 8
}

export function getTimeSignatureUnits([
  numBeats,
  beatValue
]: SongNotation['timeSignature']): number {
  return (numBeats * 32) / beatValue
}

function buildRestFill(missingUnits: number): NotationNote[] | null {
  const rests: NotationNote[] = []
  let remaining = missingUnits

  for (const spec of REST_FILL_SPECS) {
    while (remaining >= spec.units) {
      rests.push({
        pitch: 'rest',
        duration: spec.duration,
        ...(spec.dotted ? { dotted: true } : {})
      })
      remaining -= spec.units
    }
  }

  if (remaining !== 0) return null

  return rests
}

export function normalizeSongNotation(notation: SongNotation): SongNotation {
  const expectedUnits = getTimeSignatureUnits(notation.timeSignature)
  let changed = false

  const measures = notation.measures.map((measure, index, allMeasures) => {
    const missingUnits = expectedUnits - getMeasureDurationUnits(measure)

    if (missingUnits <= 0) return measure
    if (index === 0 || index === allMeasures.length - 1) return measure

    const restFill = buildRestFill(missingUnits)
    if (!restFill || restFill.length === 0) return measure

    changed = true
    return {
      ...measure,
      notes: [...measure.notes, ...restFill]
    }
  })

  return changed ? { ...notation, measures } : notation
}

export function normalizeSongDefinition(song: SongDefinition): SongDefinition {
  if (!song.notation) return song
  return {
    ...song,
    notation: normalizeSongNotation(song.notation)
  }
}
