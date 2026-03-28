import { describe, it, expect } from 'vitest'
import { INTERVALS } from '../../src/renderer/utils/interval-data'

describe('INTERVALS data', () => {
  it('has 13 entries (unison through octave)', () => {
    expect(INTERVALS).toHaveLength(13)
  })

  it('semitones range from 0 to 12', () => {
    expect(INTERVALS[0].semitones).toBe(0)
    expect(INTERVALS[INTERVALS.length - 1].semitones).toBe(12)
  })

  it('semitones are in ascending order', () => {
    for (let i = 1; i < INTERVALS.length; i++) {
      expect(INTERVALS[i].semitones).toBeGreaterThan(INTERVALS[i - 1].semitones)
    }
  })

  it('all names are unique', () => {
    const names = INTERVALS.map((i) => i.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('all shortNames are unique', () => {
    const shorts = INTERVALS.map((i) => i.shortName)
    expect(new Set(shorts).size).toBe(shorts.length)
  })

  it('starts with Unison and ends with Octave', () => {
    expect(INTERVALS[0].name).toBe('Unison')
    expect(INTERVALS[INTERVALS.length - 1].name).toBe('Octave')
  })

  it('contains Perfect 5th at 7 semitones', () => {
    const p5 = INTERVALS.find((i) => i.semitones === 7)
    expect(p5).toBeDefined()
    expect(p5!.name).toBe('Perfect 5th')
  })
})
