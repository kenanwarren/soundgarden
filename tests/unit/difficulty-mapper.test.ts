import { describe, it, expect } from 'vitest'
import type { SngAnchor, SngChordTemplate, SngNoteData } from '../../scripts/psarc-convert/types'
import type { GridMeasure } from '../../scripts/psarc-convert/beat-grid'
import {
  computeDifficultyScore,
  computeNoteDensity,
  computeTempoComplexity,
  computeTechniqueScore,
  computeFretMovement,
  computeChordComplexity,
  computeStringCrossing,
  getEffectiveDuration,
  scoreToRank,
  rankToDifficulty,
  sampleDifficultyLevels
} from '../../scripts/psarc-convert/difficulty-mapper'

function makeNote(overrides: Partial<SngNoteData> = {}): SngNoteData {
  return {
    time: 0,
    string: 0,
    fret: 0,
    chordId: -1,
    chordNotesId: -1,
    sustain: 0.1,
    bend: 0,
    slideTo: -1,
    slideUnpitchTo: -1,
    vibrato: 0,
    mask: 0,
    anchorFret: 0,
    anchorWidth: 4,
    fingerprint0: 0,
    fingerprint1: 0,
    ...overrides
  }
}

function makeGrid(measures: number, tempo: number, beatsPerMeasure = 4): GridMeasure[] {
  const beatDuration = 60 / tempo
  const measureDuration = beatDuration * beatsPerMeasure
  const grid: GridMeasure[] = []
  for (let i = 0; i < measures; i++) {
    const startTime = i * measureDuration
    const endTime = (i + 1) * measureDuration
    const beats = Array.from({ length: beatsPerMeasure }, (_, j) => ({
      time: startTime + j * beatDuration,
      duration: beatDuration,
      beatIndex: j
    }))
    grid.push({
      measureNum: i,
      startTime,
      endTime,
      beatsInMeasure: beatsPerMeasure,
      beatDuration,
      tempo,
      beats
    })
  }
  return grid
}

function makeAnchor(fret: number, start: number, end: number): SngAnchor {
  return { fret, startTime: start, endTime: end, width: 4, phraseIterationId: 0 }
}

function makeChordTemplate(
  name: string,
  frets: number[],
  fingers: number[] = [-1, -1, -1, -1, -1, -1]
): SngChordTemplate {
  return { mask: 0, frets, fingers, notes: [0, 0, 0, 0, 0, 0], name }
}

describe('getEffectiveDuration', () => {
  it('returns 0 for empty notes', () => {
    expect(getEffectiveDuration([], 4)).toBe(0)
  })

  it('returns sustain for single note', () => {
    expect(getEffectiveDuration([makeNote({ sustain: 2 })], 4)).toBe(2)
  })

  it('returns minimum 0.5 for single note with short sustain', () => {
    expect(getEffectiveDuration([makeNote({ sustain: 0.1 })], 4)).toBe(0.5)
  })

  it('sums gaps between notes capped at maxGap', () => {
    const notes = [
      makeNote({ time: 0, sustain: 0.1 }),
      makeNote({ time: 1, sustain: 0.1 }),
      makeNote({ time: 10, sustain: 0.5 }) // 9s gap, capped at 4
    ]
    // gap1: min(1, 4) = 1, gap2: min(9, 4) = 4, last sustain: min(0.5, 4) = 0.5
    expect(getEffectiveDuration(notes, 4)).toBeCloseTo(5.5)
  })
})

describe('computeNoteDensity', () => {
  it('returns 0 for zero duration', () => {
    expect(computeNoteDensity([], 0)).toBe(0)
  })

  it('normalizes to 1 at 6+ NPS', () => {
    const notes = Array.from({ length: 60 }, (_, i) => makeNote({ time: i * 0.1 }))
    // 60 notes / 10s = 6 NPS → 1.0
    expect(computeNoteDensity(notes, 10)).toBeCloseTo(1)
  })

  it('returns ~0.5 at 3 NPS', () => {
    const notes = Array.from({ length: 30 }, (_, i) => makeNote({ time: i * 0.33 }))
    expect(computeNoteDensity(notes, 10)).toBeCloseTo(0.5, 1)
  })
})

describe('computeTempoComplexity', () => {
  it('returns 0 for empty notes', () => {
    expect(computeTempoComplexity([], makeGrid(4, 120))).toBe(0)
  })

  it('returns 0 for empty grid', () => {
    expect(computeTempoComplexity([makeNote()], [])).toBe(0)
  })

  it('scores higher for faster tempos with same note density', () => {
    const notes = Array.from({ length: 16 }, (_, i) => makeNote({ time: i * 0.5 }))
    const slow = computeTempoComplexity(notes, makeGrid(4, 80))
    const fast = computeTempoComplexity(notes, makeGrid(4, 200))
    expect(fast).toBeGreaterThan(slow)
  })
})

describe('computeTechniqueScore', () => {
  it('returns 0 for notes without techniques', () => {
    const notes = [makeNote(), makeNote()]
    expect(computeTechniqueScore(notes)).toBe(0)
  })

  it('scores bends higher than hammer-ons', () => {
    const bends = [makeNote({ mask: 0x0010 }), makeNote({ mask: 0x0010 })]
    const hammers = [makeNote({ mask: 0x0002 }), makeNote({ mask: 0x0002 })]
    expect(computeTechniqueScore(bends)).toBeGreaterThan(computeTechniqueScore(hammers))
  })

  it('includes vibrato from vibrato field', () => {
    const plain = [makeNote()]
    const withVibrato = [makeNote({ vibrato: 80 })]
    expect(computeTechniqueScore(withVibrato)).toBeGreaterThan(computeTechniqueScore(plain))
  })

  it('caps at 1.0', () => {
    // Note with every technique + vibrato
    const mask = 0x0002 | 0x0004 | 0x0008 | 0x0010 | 0x0040 | 0x0080
    const notes = [makeNote({ mask, vibrato: 100 })]
    expect(computeTechniqueScore(notes)).toBeLessThanOrEqual(1)
  })
})

describe('computeFretMovement', () => {
  it('returns 0 for empty notes', () => {
    expect(computeFretMovement([], [])).toBe(0)
  })

  it('scores low for small fret range with no anchor changes', () => {
    const notes = [makeNote({ fret: 0 }), makeNote({ fret: 2 })]
    const anchors = [makeAnchor(0, 0, 10)]
    expect(computeFretMovement(notes, anchors)).toBeCloseTo(0)
  })

  it('scores higher for wide fret span', () => {
    const narrow = [makeNote({ fret: 3 }), makeNote({ fret: 5 })]
    const wide = [makeNote({ fret: 0 }), makeNote({ fret: 20 })]
    const anchors = [makeAnchor(0, 0, 10)]
    expect(computeFretMovement(wide, anchors)).toBeGreaterThan(computeFretMovement(narrow, anchors))
  })

  it('scores higher for frequent anchor changes', () => {
    const notes = [makeNote({ fret: 0 }), makeNote({ fret: 12 })]
    const stable = [makeAnchor(0, 0, 10)]
    const moving = [
      makeAnchor(0, 0, 2),
      makeAnchor(5, 2, 4),
      makeAnchor(0, 4, 6),
      makeAnchor(7, 6, 8),
      makeAnchor(0, 8, 10)
    ]
    expect(computeFretMovement(notes, moving)).toBeGreaterThan(computeFretMovement(notes, stable))
  })
})

describe('computeChordComplexity', () => {
  it('returns 0 when no notes reference chords', () => {
    const notes = [makeNote({ chordId: -1 })]
    const templates = [makeChordTemplate('Am', [-1, 0, 2, 2, 1, 0])]
    expect(computeChordComplexity(notes, templates)).toBe(0)
  })

  it('returns 0 for empty templates', () => {
    expect(computeChordComplexity([makeNote({ chordId: 0 })], [])).toBe(0)
  })

  it('scores higher for barre chords', () => {
    const notes = [makeNote({ chordId: 0 })]
    const open = [makeChordTemplate('C', [-1, 3, 2, 0, 1, 0], [-1, 3, 2, 0, 1, 0])]
    const barre = [makeChordTemplate('F', [1, 1, 2, 3, 3, 1], [1, 1, 2, 3, 4, 1])]
    expect(computeChordComplexity(notes, barre)).toBeGreaterThan(
      computeChordComplexity(notes, open)
    )
  })
})

describe('computeStringCrossing', () => {
  it('returns 0 for single note', () => {
    expect(computeStringCrossing([makeNote()])).toBe(0)
  })

  it('returns 0 when all notes on same string', () => {
    const notes = [makeNote({ string: 2 }), makeNote({ string: 2 }), makeNote({ string: 2 })]
    expect(computeStringCrossing(notes)).toBe(0)
  })

  it('scores higher for frequent string jumps', () => {
    const adjacent = [makeNote({ string: 0 }), makeNote({ string: 1 }), makeNote({ string: 2 })]
    const jumping = [makeNote({ string: 0 }), makeNote({ string: 4 }), makeNote({ string: 1 })]
    expect(computeStringCrossing(jumping)).toBeGreaterThan(computeStringCrossing(adjacent))
  })
})

describe('scoreToRank', () => {
  it('maps 0 to rank 0', () => {
    expect(scoreToRank(0)).toBe(0)
  })

  it('maps 1.0 to rank 8', () => {
    expect(scoreToRank(1.0)).toBe(8)
  })

  it('maps boundary values correctly', () => {
    expect(scoreToRank(0.07)).toBe(0) // below 0.08
    expect(scoreToRank(0.08)).toBe(1) // at 0.08
    expect(scoreToRank(0.29)).toBe(2) // below 0.30
    expect(scoreToRank(0.3)).toBe(3) // at 0.30
    expect(scoreToRank(0.89)).toBe(7) // below 0.90
    expect(scoreToRank(0.9)).toBe(8) // at 0.90
  })
})

describe('rankToDifficulty', () => {
  it('maps rank 0 to Beginner 1', () => {
    expect(rankToDifficulty(0)).toEqual({ tier: 'Beginner', grade: 1 })
  })

  it('maps rank 4 to Intermediate 2', () => {
    expect(rankToDifficulty(4)).toEqual({ tier: 'Intermediate', grade: 2 })
  })

  it('maps rank 8 to Advanced 3', () => {
    expect(rankToDifficulty(8)).toEqual({ tier: 'Advanced', grade: 3 })
  })

  it('clamps out-of-range values', () => {
    expect(rankToDifficulty(-1)).toEqual({ tier: 'Beginner', grade: 1 })
    expect(rankToDifficulty(10)).toEqual({ tier: 'Advanced', grade: 3 })
  })
})

describe('computeDifficultyScore', () => {
  it('returns 0 score for empty notes', () => {
    const { score, metrics } = computeDifficultyScore([], [], [], [], 'rhythm')
    expect(score).toBe(0)
    expect(metrics.noteDensity).toBe(0)
  })

  it('scores simple open-string notes as beginner', () => {
    // Slow, simple notes on one string, no techniques
    const notes = Array.from({ length: 8 }, (_, i) => makeNote({ time: i * 1, fret: 0, string: 0 }))
    const grid = makeGrid(2, 120)
    const { score } = computeDifficultyScore(notes, [], [], grid, 'rhythm')
    expect(scoreToRank(score)).toBeLessThanOrEqual(2) // Beginner tier
  })

  it('scores fast technical notes as advanced', () => {
    const bendMask = 0x0010 | 0x0080 // bend + slide
    const notes = Array.from({ length: 120 }, (_, i) =>
      makeNote({
        time: i * 0.1,
        fret: (i * 3) % 22,
        string: i % 6,
        mask: bendMask,
        vibrato: 50
      })
    )
    const anchors = Array.from({ length: 20 }, (_, i) =>
      makeAnchor((i * 5) % 20, i * 0.6, (i + 1) * 0.6)
    )
    const grid = makeGrid(8, 180)
    const { score } = computeDifficultyScore(notes, anchors, [], grid, 'lead')
    expect(scoreToRank(score)).toBeGreaterThanOrEqual(6) // Advanced tier
  })

  it('applies arrangement type bias', () => {
    const notes = Array.from({ length: 20 }, (_, i) =>
      makeNote({ time: i * 0.5, fret: i % 5, string: i % 3 })
    )
    const grid = makeGrid(4, 120)
    const { score: rhythmScore } = computeDifficultyScore(notes, [], [], grid, 'rhythm')
    const { score: leadScore } = computeDifficultyScore(notes, [], [], grid, 'lead')
    expect(leadScore).toBeGreaterThan(rhythmScore)
  })
})

describe('sampleDifficultyLevels', () => {
  it('returns empty for no phrases and no arrangements', () => {
    const sngData = {
      beats: [],
      phrases: [],
      phraseIterations: [],
      chordTemplates: [],
      sections: [],
      arrangements: [],
      notes: [],
      vocals: []
    }
    expect(sampleDifficultyLevels(sngData, 'lead')).toEqual([])
  })

  it('returns monotonically increasing difficulty', () => {
    const makeLevel = (difficulty: number, noteCount: number) => ({
      difficulty,
      anchors: [],
      notes: Array.from({ length: noteCount }, (_, i) =>
        makeNote({ time: i * 0.5, fret: i % 5, string: i % 3 })
      ),
      chordNotes: [],
      phraseCount: 1
    })

    const sngData = {
      beats: makeGrid(8, 120).flatMap((m) =>
        m.beats.map((b) => ({
          time: b.time,
          measure: m.measureNum,
          beat: b.beatIndex,
          phraseIteration: 0,
          mask: 0
        }))
      ),
      phrases: [
        {
          solo: 0,
          disparity: 0,
          ignore: 0,
          maxDifficulty: 10,
          phraseIterationLinks: 0,
          name: 'default'
        }
      ],
      phraseIterations: [],
      chordTemplates: [],
      sections: [],
      arrangements: [makeLevel(0, 5), makeLevel(5, 20), makeLevel(10, 50)],
      notes: [],
      vocals: []
    }

    const levels = sampleDifficultyLevels(sngData, 'rhythm')
    expect(levels.length).toBe(3)

    // Verify monotonicity
    for (let i = 1; i < levels.length; i++) {
      const prevRank =
        ['Beginner', 'Intermediate', 'Advanced'].indexOf(levels[i - 1].difficulty.tier) * 3 +
        (levels[i - 1].difficulty.grade - 1)
      const currRank =
        ['Beginner', 'Intermediate', 'Advanced'].indexOf(levels[i].difficulty.tier) * 3 +
        (levels[i].difficulty.grade - 1)
      expect(currRank).toBeGreaterThan(prevRank)
    }
  })

  it('respects baseDifficulty override', () => {
    const sngData = {
      beats: [],
      phrases: [
        {
          solo: 0,
          disparity: 0,
          ignore: 0,
          maxDifficulty: 2,
          phraseIterationLinks: 0,
          name: 'default'
        }
      ],
      phraseIterations: [],
      chordTemplates: [],
      sections: [],
      arrangements: [
        { difficulty: 0, anchors: [], notes: [], chordNotes: [], phraseCount: 1 },
        { difficulty: 1, anchors: [], notes: [], chordNotes: [], phraseCount: 1 },
        { difficulty: 2, anchors: [], notes: [], chordNotes: [], phraseCount: 1 }
      ],
      notes: [],
      vocals: []
    }

    const levels = sampleDifficultyLevels(sngData, 'lead', {
      tier: 'Intermediate',
      grade: 2
    })
    expect(levels[0].difficulty).toEqual({ tier: 'Intermediate', grade: 2 })
    expect(levels[1].difficulty).toEqual({ tier: 'Intermediate', grade: 3 })
    expect(levels[2].difficulty).toEqual({ tier: 'Advanced', grade: 1 })
  })
})
