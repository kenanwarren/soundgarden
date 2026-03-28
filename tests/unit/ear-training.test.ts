import { describe, it, expect } from 'vitest'
import { generateChallenge } from '../../src/renderer/utils/ear-training-challenge'
import { NOTE_NAMES } from '../../src/renderer/utils/constants'
import { INTERVALS } from '../../src/renderer/utils/interval-data'

describe('generateChallenge', () => {
  describe('note mode', () => {
    it('target equals reference', () => {
      for (let i = 0; i < 20; i++) {
        const challenge = generateChallenge('note')
        expect(challenge.targetNote).toBe(challenge.referenceNote)
        expect(challenge.targetOctave).toBe(challenge.referenceOctave)
        expect(challenge.intervalSemitones).toBe(0)
        expect(challenge.intervalName).toBe('Unison')
      }
    })

    it('reference note is always a valid note name', () => {
      const noteSet = new Set(NOTE_NAMES)
      for (let i = 0; i < 50; i++) {
        const challenge = generateChallenge('note')
        expect(noteSet.has(challenge.referenceNote)).toBe(true)
      }
    })

    it('reference octave is 3 or 4', () => {
      const octaves = new Set<number>()
      for (let i = 0; i < 100; i++) {
        octaves.add(generateChallenge('note').referenceOctave)
      }
      for (const oct of octaves) {
        expect(oct === 3 || oct === 4).toBe(true)
      }
    })
  })

  describe('interval mode', () => {
    it('interval semitones are always 1-12', () => {
      for (let i = 0; i < 50; i++) {
        const challenge = generateChallenge('interval')
        expect(challenge.intervalSemitones).toBeGreaterThanOrEqual(1)
        expect(challenge.intervalSemitones).toBeLessThanOrEqual(12)
      }
    })

    it('interval name comes from INTERVALS data', () => {
      const validNames = new Set(INTERVALS.map((i) => i.name))
      for (let i = 0; i < 50; i++) {
        const challenge = generateChallenge('interval')
        expect(validNames.has(challenge.intervalName)).toBe(true)
      }
    })

    it('target note is correct semitones away from reference', () => {
      for (let i = 0; i < 50; i++) {
        const challenge = generateChallenge('interval')
        const refIdx = NOTE_NAMES.indexOf(challenge.referenceNote)
        const targetIdx = NOTE_NAMES.indexOf(challenge.targetNote)
        const expectedIdx = (refIdx + challenge.intervalSemitones) % 12
        expect(targetIdx).toBe(expectedIdx)
      }
    })

    it('octave wrapping works for high intervals', () => {
      // Run many times to hit wrapping cases
      let sawWrap = false
      for (let i = 0; i < 200; i++) {
        const challenge = generateChallenge('interval')
        if (challenge.targetOctave > challenge.referenceOctave) {
          sawWrap = true
          const refIdx = NOTE_NAMES.indexOf(challenge.referenceNote)
          const expectedOctave =
            challenge.referenceOctave + Math.floor((refIdx + challenge.intervalSemitones) / 12)
          expect(challenge.targetOctave).toBe(expectedOctave)
        }
      }
      expect(sawWrap).toBe(true)
    })

    it('target note is always a valid note name', () => {
      const noteSet = new Set(NOTE_NAMES)
      for (let i = 0; i < 50; i++) {
        const challenge = generateChallenge('interval')
        expect(noteSet.has(challenge.targetNote)).toBe(true)
      }
    })
  })
})
