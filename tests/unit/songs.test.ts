import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import type {
  PracticeDifficulty,
  SongDefinition,
  SongNotation
} from '../../src/renderer/utils/learn-types'
import {
  buildSongCatalog,
  formatDifficulty,
  getDifficultyRank,
  getPreferredSongArrangement,
  getSongArrangements,
  getSongDifficultyLabel
} from '../../src/renderer/utils/songs'

function loadSongs(): SongDefinition[] {
  const dir = join(__dirname, '..', '..', 'resources', 'data', 'songs')
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf-8')) as SongDefinition)
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

const BEGINNER_1: PracticeDifficulty = { tier: 'Beginner', grade: 1 }
const INTERMEDIATE_1: PracticeDifficulty = { tier: 'Intermediate', grade: 1 }
const ADVANCED_1: PracticeDifficulty = { tier: 'Advanced', grade: 1 }

describe('getDifficultyRank', () => {
  it('ranks Beginner 1 as 0', () => {
    expect(getDifficultyRank({ tier: 'Beginner', grade: 1 })).toBe(0)
  })

  it('ranks Advanced 3 as 8', () => {
    expect(getDifficultyRank({ tier: 'Advanced', grade: 3 })).toBe(8)
  })

  it('orders all 9 levels correctly', () => {
    const ranks = []
    for (const tier of ['Beginner', 'Intermediate', 'Advanced'] as const) {
      for (const grade of [1, 2, 3] as const) {
        ranks.push(getDifficultyRank({ tier, grade }))
      }
    }
    expect(ranks).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })
})

describe('formatDifficulty', () => {
  it('formats as "Tier Grade"', () => {
    expect(formatDifficulty({ tier: 'Beginner', grade: 1 })).toBe('Beginner 1')
    expect(formatDifficulty({ tier: 'Advanced', grade: 3 })).toBe('Advanced 3')
  })
})

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
    expect(getSongDifficultyLabel(saints!)).toBe('Beginner 1 to Intermediate 1')
  })

  it('groups wildwood-flower-carter under wildwood-flower', () => {
    const catalog = buildSongCatalog(loadSongs())
    const wf = catalog.find((song) => song.id === 'wildwood-flower')

    expect(wf).toBeTruthy()
    expect(catalog.some((song) => song.id === 'wildwood-flower-carter')).toBe(false)
    expect(getSongArrangements(wf!).map((a) => a.label)).toEqual(['Standard', 'Carter Style'])
    expect(getSongDifficultyLabel(wf!)).toBe('Beginner 1 to Intermediate 1')
    expect(wf?.genres).toEqual(expect.arrayContaining(['fingerpicking']))
  })

  it('groups amazing-grace-embellished under amazing-grace', () => {
    const catalog = buildSongCatalog(loadSongs())
    const ag = catalog.find((song) => song.id === 'amazing-grace')

    expect(ag).toBeTruthy()
    expect(catalog.some((song) => song.id === 'amazing-grace-embellished')).toBe(false)
    expect(getSongArrangements(ag!).map((a) => a.label)).toEqual(['Standard', 'Embellished'])
    expect(getSongDifficultyLabel(ag!)).toBe('Beginner 1 to Intermediate 1')
  })

  it('groups greensleeves-lute-style under greensleeves', () => {
    const catalog = buildSongCatalog(loadSongs())
    const gs = catalog.find((song) => song.id === 'greensleeves')

    expect(gs).toBeTruthy()
    expect(catalog.some((song) => song.id === 'greensleeves-lute-style')).toBe(false)
    expect(getSongArrangements(gs!).map((a) => a.label)).toEqual(['Standard', 'Lute Style'])
    expect(getSongDifficultyLabel(gs!)).toBe('Intermediate 1 to Advanced 1')
  })

  it('groups house-rising-sun-arpeggio under house-of-the-rising-sun', () => {
    const catalog = buildSongCatalog(loadSongs())
    const hrs = catalog.find((song) => song.id === 'house-of-the-rising-sun')

    expect(hrs).toBeTruthy()
    expect(catalog.some((song) => song.id === 'house-rising-sun-arpeggio')).toBe(false)
    expect(getSongArrangements(hrs!).map((a) => a.label)).toEqual(['Standard', 'Arpeggio'])
    expect(getSongDifficultyLabel(hrs!)).toBe('Intermediate 1 to Advanced 1')
  })

  it('keeps orphaned variants visible as standalone songs', () => {
    const orphanVariant: SongDefinition = {
      id: 'orphan-variant',
      title: 'Orphan Variant',
      variantOf: 'missing-song',
      variantLabel: 'Alt',
      genres: ['general'],
      difficulty: INTERMEDIATE_1,
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
      difficulty: BEGINNER_1,
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
          difficulty: BEGINNER_1,
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
          difficulty: INTERMEDIATE_1,
          key: 'G',
          chords: ['G7'],
          attribution: 'Traditional, funk arrangement',
          lines: ['Alt line'],
          notation: makeNotation('F4')
        }
      ]
    }

    expect(getPreferredSongArrangement(song, 'Intermediate')?.id).toBe('saints-funk')
    expect(getPreferredSongArrangement(song, 'Beginner')?.id).toBe('saints')
    expect(getPreferredSongArrangement(song, 'Beginner', 'saints-funk')?.id).toBe('saints-funk')
  })

  it('selects an Intermediate arrangement from catalog data', () => {
    const catalog = buildSongCatalog(loadSongs())
    const wf = catalog.find((s) => s.id === 'wildwood-flower')!
    const arr = getPreferredSongArrangement(wf, 'Intermediate')
    expect(arr?.id).toBe('wildwood-flower-carter')
    expect(arr?.difficulty.tier).toBe('Intermediate')
  })

  it('selects an Advanced arrangement from catalog data', () => {
    const catalog = buildSongCatalog(loadSongs())
    const gs = catalog.find((s) => s.id === 'greensleeves')!
    const arr = getPreferredSongArrangement(gs, 'Advanced')
    expect(arr?.id).toBe('greensleeves-lute-style')
    expect(arr?.difficulty.tier).toBe('Advanced')
  })
})
