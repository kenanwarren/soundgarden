import { describe, it, expect } from 'vitest'
import { getFretNote, getScalePositions } from '../../src/renderer/utils/fretboard-data'
import { TUNING_PRESETS } from '../../src/renderer/utils/constants'

describe('getFretNote', () => {
  const standard = TUNING_PRESETS.Standard

  it('open strings match standard tuning', () => {
    const expected = ['E', 'A', 'D', 'G', 'B', 'E']
    for (let s = 0; s < 6; s++) {
      expect(getFretNote(s, 0, standard).note).toBe(expected[s])
    }
  })

  it('12th fret is same note as open string', () => {
    for (let s = 0; s < 6; s++) {
      const open = getFretNote(s, 0, standard)
      const twelfth = getFretNote(s, 12, standard)
      expect(twelfth.note).toBe(open.note)
      expect(twelfth.octave).toBe(open.octave + 1)
    }
  })

  it('5th fret of low E string is A', () => {
    const pos = getFretNote(0, 5, standard)
    expect(pos.note).toBe('A')
  })

  it('3rd fret of A string is C', () => {
    const pos = getFretNote(1, 3, standard)
    expect(pos.note).toBe('C')
  })

  it('returns correct octave for high frets', () => {
    const pos = getFretNote(5, 24, standard)
    expect(pos.note).toBe('E')
    expect(pos.octave).toBe(6)
  })
})

describe('getScalePositions', () => {
  it('returns only notes in the scale', () => {
    const cMajor = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const positions = getScalePositions(cMajor)
    const noteSet = new Set(cMajor)
    for (const pos of positions) {
      expect(noteSet.has(pos.note)).toBe(true)
    }
  })

  it('covers all 6 strings', () => {
    const cMajor = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const positions = getScalePositions(cMajor)
    const strings = new Set(positions.map((p) => p.string))
    expect(strings.size).toBe(6)
  })

  it('returns positions up to maxFret', () => {
    const positions = getScalePositions(['A'], TUNING_PRESETS.Standard, 5)
    for (const pos of positions) {
      expect(pos.fret).toBeLessThanOrEqual(5)
    }
  })

  it('empty scale returns no positions', () => {
    expect(getScalePositions([])).toHaveLength(0)
  })
})
