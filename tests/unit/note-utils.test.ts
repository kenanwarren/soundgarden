import { describe, it, expect } from 'vitest'
import { frequencyToNote, noteToFrequency } from '../../src/renderer/utils/note-utils'

describe('frequencyToNote', () => {
  it('detects A4 at 440Hz', () => {
    const result = frequencyToNote(440)
    expect(result.note).toBe('A')
    expect(result.octave).toBe(4)
    expect(result.cents).toBe(0)
  })

  it('detects E2 (low E string)', () => {
    const result = frequencyToNote(82.41)
    expect(result.note).toBe('E')
    expect(result.octave).toBe(2)
    expect(Math.abs(result.cents)).toBeLessThanOrEqual(2)
  })

  it('detects B3', () => {
    const result = frequencyToNote(246.94)
    expect(result.note).toBe('B')
    expect(result.octave).toBe(3)
    expect(Math.abs(result.cents)).toBeLessThanOrEqual(2)
  })

  it('detects E4 (high E string)', () => {
    const result = frequencyToNote(329.63)
    expect(result.note).toBe('E')
    expect(result.octave).toBe(4)
    expect(Math.abs(result.cents)).toBeLessThanOrEqual(2)
  })

  it('reports positive cents when sharp', () => {
    const result = frequencyToNote(445) // sharp of A4
    expect(result.note).toBe('A')
    expect(result.cents).toBeGreaterThan(0)
  })

  it('reports negative cents when flat', () => {
    const result = frequencyToNote(435) // flat of A4
    expect(result.note).toBe('A')
    expect(result.cents).toBeLessThan(0)
  })

  it('works with custom reference pitch', () => {
    const result = frequencyToNote(432, 432)
    expect(result.note).toBe('A')
    expect(result.octave).toBe(4)
    expect(result.cents).toBe(0)
  })
})

describe('noteToFrequency', () => {
  it('returns 440 for A4', () => {
    expect(noteToFrequency('A', 4)).toBeCloseTo(440, 1)
  })

  it('returns ~82.41 for E2', () => {
    expect(noteToFrequency('E', 2)).toBeCloseTo(82.41, 0)
  })

  it('returns ~329.63 for E4', () => {
    expect(noteToFrequency('E', 4)).toBeCloseTo(329.63, 0)
  })

  it('returns 0 for invalid note', () => {
    expect(noteToFrequency('X', 4)).toBe(0)
  })

  it('roundtrips with frequencyToNote', () => {
    const freq = noteToFrequency('G', 3)
    const result = frequencyToNote(freq)
    expect(result.note).toBe('G')
    expect(result.octave).toBe(3)
    expect(result.cents).toBe(0)
  })
})
