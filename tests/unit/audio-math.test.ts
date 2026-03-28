import { describe, it, expect } from 'vitest'
import { linearToDb, dbToLinear, clamp } from '../../src/renderer/utils/audio-math'

describe('linearToDb', () => {
  it('converts 1.0 to 0 dB', () => {
    expect(linearToDb(1.0)).toBeCloseTo(0)
  })

  it('converts 0.5 to approximately -6 dB', () => {
    expect(linearToDb(0.5)).toBeCloseTo(-6.02, 1)
  })

  it('converts 0.1 to -20 dB', () => {
    expect(linearToDb(0.1)).toBeCloseTo(-20)
  })

  it('handles 0 without returning -Infinity', () => {
    const result = linearToDb(0)
    expect(result).toBeLessThan(-100)
    expect(Number.isFinite(result)).toBe(true)
  })
})

describe('dbToLinear', () => {
  it('converts 0 dB to 1.0', () => {
    expect(dbToLinear(0)).toBeCloseTo(1.0)
  })

  it('converts -20 dB to 0.1', () => {
    expect(dbToLinear(-20)).toBeCloseTo(0.1)
  })

  it('converts -6 dB to approximately 0.5', () => {
    expect(dbToLinear(-6)).toBeCloseTo(0.501, 2)
  })
})

describe('linearToDb / dbToLinear round-trip', () => {
  for (const value of [0.01, 0.1, 0.5, 1.0, 2.0]) {
    it(`round-trips ${value}`, () => {
      expect(dbToLinear(linearToDb(value))).toBeCloseTo(value)
    })
  }
})

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps to max', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('handles equal min and max', () => {
    expect(clamp(5, 3, 3)).toBe(3)
  })

  it('handles value equal to boundary', () => {
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })
})
