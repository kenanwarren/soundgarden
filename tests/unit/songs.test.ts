import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import type { SongDefinition, SongNotation } from '../../src/renderer/utils/learn-types'
import {
  buildSongCatalog,
  getPreferredSongArrangement,
  getSongArrangements,
  getSongDifficultyLabel
} from '../../src/renderer/utils/songs'

function loadSongs(): SongDefinition[] {
  return JSON.parse(
    readFileSync(join(__dirname, '..', '..', 'resources', 'data', 'songs.json'), 'utf-8')
  ) as SongDefinition[]
}

function makeNotation(pitch: string): SongNotation {
  return {
    timeSignature: [4, 4],
    measures: [
      {
        notes: [{ pitch, duration: 'whole' }]
      }
    ]
  }
}

describe('buildSongCatalog', () => {
  it('groups linked variant songs under their base song', () => {
    const catalog = buildSongCatalog(loadSongs())
    const saints = catalog.find((song) => song.id === 'when-the-saints')

    expect(saints).toBeTruthy()
    expect(catalog.some((song) => song.id === 'saints-funk')).toBe(false)
    expect(saints?.genres).toEqual(expect.arrayContaining(['rock', 'funk']))
    expect(getSongArrangements(saints!).map((arrangement) => arrangement.label)).toEqual([
      'Standard',
      'Funk'
    ])
    expect(getSongDifficultyLabel(saints!)).toBe('Beginner to Developing')
  })

  it('keeps orphaned variants visible as standalone songs', () => {
    const orphanVariant: SongDefinition = {
      id: 'orphan-variant',
      title: 'Orphan Variant',
      variantOf: 'missing-song',
      variantLabel: 'Alt',
      genres: ['general'],
      difficulty: 'Developing',
      key: 'C',
      chords: ['C'],
      attribution: 'Traditional',
      lines: ['Test line'],
      notation: makeNotation('C4')
    }

    const catalog = buildSongCatalog([orphanVariant])

    expect(catalog).toHaveLength(1)
    expect(catalog[0].id).toBe('orphan-variant')
    expect(getSongArrangements(catalog[0])).toHaveLength(1)
  })
})

describe('getPreferredSongArrangement', () => {
  it('defaults to an arrangement matching the active difficulty filter', () => {
    const song: SongDefinition = {
      id: 'saints',
      title: 'Saints',
      genres: ['rock'],
      difficulty: 'Beginner',
      key: 'G',
      chords: ['G'],
      attribution: 'Traditional',
      lines: ['Base line'],
      notation: makeNotation('G4'),
      arrangements: [
        {
          id: 'saints',
          label: 'Standard',
          isDefault: true,
          difficulty: 'Beginner',
          key: 'G',
          chords: ['G'],
          attribution: 'Traditional',
          lines: ['Base line'],
          notation: makeNotation('G4')
        },
        {
          id: 'saints-funk',
          label: 'Funk',
          isDefault: false,
          difficulty: 'Developing',
          key: 'G',
          chords: ['G7'],
          attribution: 'Traditional, funk arrangement',
          lines: ['Alt line'],
          notation: makeNotation('F4')
        }
      ]
    }

    expect(getPreferredSongArrangement(song, 'Developing')?.id).toBe('saints-funk')
    expect(getPreferredSongArrangement(song, 'Beginner')?.id).toBe('saints')
    expect(getPreferredSongArrangement(song, 'Beginner', 'saints-funk')?.id).toBe('saints-funk')
  })
})
