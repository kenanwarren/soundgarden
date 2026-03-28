import { describe, it, expect } from 'vitest'
import { SCALES, getScaleNotes } from '../../src/renderer/utils/scale-data'
import { NOTE_NAMES } from '../../src/renderer/utils/constants'

describe('getScaleNotes', () => {
  it('returns C Major correctly', () => {
    const major = SCALES.find((s) => s.name === 'Major')!
    expect(getScaleNotes('C', major)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
  })

  it('returns A Minor Pentatonic correctly', () => {
    const minPent = SCALES.find((s) => s.name === 'Minor Pentatonic')!
    expect(getScaleNotes('A', minPent)).toEqual(['A', 'C', 'D', 'E', 'G'])
  })

  it('returns E Blues correctly', () => {
    const blues = SCALES.find((s) => s.name === 'Blues')!
    expect(getScaleNotes('E', blues)).toEqual(['E', 'G', 'A', 'A#', 'B', 'D'])
  })

  it('returns empty array for invalid root', () => {
    expect(getScaleNotes('Z', SCALES[0])).toEqual([])
  })

  it('produces correct note count for every root and scale', () => {
    for (const scale of SCALES) {
      for (const root of NOTE_NAMES) {
        const notes = getScaleNotes(root, scale)
        expect(notes).toHaveLength(scale.intervals.length)
      }
    }
  })

  it('all returned notes are valid note names', () => {
    const noteSet = new Set(NOTE_NAMES)
    for (const scale of SCALES) {
      const notes = getScaleNotes('C', scale)
      for (const note of notes) {
        expect(noteSet.has(note)).toBe(true)
      }
    }
  })

  it('wraps around correctly for high-root scales', () => {
    const major = SCALES.find((s) => s.name === 'Major')!
    const bMajor = getScaleNotes('B', major)
    expect(bMajor).toContain('B')
    expect(bMajor).toContain('F#')
    expect(bMajor).toHaveLength(7)
  })
})

describe('SCALES data', () => {
  it('has at least 10 scales', () => {
    expect(SCALES.length).toBeGreaterThanOrEqual(10)
  })

  it('all scales have unique names', () => {
    const names = SCALES.map((s) => s.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('all intervals start with 0 (root)', () => {
    for (const scale of SCALES) {
      expect(scale.intervals[0]).toBe(0)
    }
  })

  it('all intervals are ascending', () => {
    for (const scale of SCALES) {
      for (let i = 1; i < scale.intervals.length; i++) {
        expect(scale.intervals[i]).toBeGreaterThan(scale.intervals[i - 1])
      }
    }
  })

  it('all intervals are within 0-11', () => {
    for (const scale of SCALES) {
      for (const interval of scale.intervals) {
        expect(interval).toBeGreaterThanOrEqual(0)
        expect(interval).toBeLessThanOrEqual(11)
      }
    }
  })
})
