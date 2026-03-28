import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import type { SongDefinition } from '../../src/renderer/utils/learn-types'
import {
  getMeasureDurationUnits,
  getTimeSignatureUnits,
  normalizeSongNotation
} from '../../src/renderer/utils/notation'

function loadSongs(): SongDefinition[] {
  return JSON.parse(
    readFileSync(join(__dirname, '..', '..', 'resources', 'data', 'songs.json'), 'utf-8')
  ) as SongDefinition[]
}

describe('normalizeSongNotation', () => {
  it('preserves a short pickup bar at the start of a song', () => {
    const notation = {
      timeSignature: [3, 4] as [number, number],
      measures: [
        {
          notes: [{ pitch: 'D4', duration: 'quarter' as const }]
        },
        {
          notes: [{ pitch: 'G4', duration: 'half' as const, dotted: true }]
        }
      ]
    }

    const normalized = normalizeSongNotation(notation)

    expect(normalized.measures[0].notes).toHaveLength(1)
    expect(normalized.measures[0].notes[0]).toMatchObject({ pitch: 'D4', duration: 'quarter' })
  })

  it('pads underfilled interior bars with rests', () => {
    const notation = {
      timeSignature: [4, 4] as [number, number],
      measures: [
        {
          notes: [{ pitch: 'C4', duration: 'whole' as const }]
        },
        {
          notes: [
            { pitch: 'D4', duration: 'quarter' as const },
            { pitch: 'rest', duration: 'quarter' as const },
            { pitch: 'E4', duration: 'eighth' as const },
            { pitch: 'F4', duration: 'eighth' as const }
          ]
        },
        {
          notes: [{ pitch: 'G4', duration: 'whole' as const }]
        }
      ]
    }

    const normalized = normalizeSongNotation(notation)
    const middleMeasure = normalized.measures[1]

    expect(middleMeasure.notes).toHaveLength(5)
    expect(middleMeasure.notes.at(-1)).toMatchObject({ pitch: 'rest', duration: 'quarter' })
    expect(getMeasureDurationUnits(middleMeasure)).toBe(
      getTimeSignatureUnits(notation.timeSignature)
    )
  })
})

describe('song notation data', () => {
  it('has no underfilled interior bars in the source data', () => {
    const offenders: string[] = []

    for (const song of loadSongs()) {
      if (!song.notation) continue

      const expectedUnits = getTimeSignatureUnits(song.notation.timeSignature)

      song.notation.measures.forEach((measure, index, allMeasures) => {
        const missingUnits = expectedUnits - getMeasureDurationUnits(measure)
        if (missingUnits > 0 && index > 0 && index < allMeasures.length - 1) {
          offenders.push(`${song.id} measure ${index + 1} missing ${missingUnits} units`)
        }
      })
    }

    expect(offenders).toEqual([])
  })

  it('only uses C-sharp melody notes in the A7 bars that need them', () => {
    const offenders: string[] = []

    for (const song of loadSongs()) {
      if (!song.notation) continue

      song.notation.measures.forEach((measure, index) => {
        measure.notes.forEach((note, noteIndex) => {
          if (note.pitch === 'C#4' && measure.chord !== 'A7') {
            offenders.push(
              `${song.id} measure ${index + 1} note ${noteIndex + 1} chord ${measure.chord ?? '-'}`
            )
          }
        })
      })
    }

    expect(offenders).toEqual([])
  })
})
