import { describe, it, expect } from 'vitest'
import { detectChord } from '../../src/renderer/utils/chord-detection'
import { NOTE_NAMES } from '../../src/renderer/utils/constants'

function makeChromagram(notes: string[], energy = 1.0): Float32Array {
  const chroma = new Float32Array(12)
  for (const note of notes) {
    const idx = NOTE_NAMES.indexOf(note)
    if (idx >= 0) chroma[idx] = energy
  }
  return chroma
}

describe('detectChord', () => {
  it('returns null for silence', () => {
    const chroma = new Float32Array(12)
    expect(detectChord(chroma)).toBeNull()
  })

  it('returns null for wrong-sized input', () => {
    expect(detectChord(new Float32Array(10))).toBeNull()
  })

  // Major chords
  it('detects C major', () => {
    const result = detectChord(makeChromagram(['C', 'E', 'G']))
    expect(result).not.toBeNull()
    expect(result!.root).toBe('C')
    expect(result!.quality).toBe('major')
    expect(result!.name).toBe('C')
  })

  it('detects G major', () => {
    const result = detectChord(makeChromagram(['G', 'B', 'D']))
    expect(result).not.toBeNull()
    expect(result!.root).toBe('G')
    expect(result!.quality).toBe('major')
  })

  it('detects D major', () => {
    const result = detectChord(makeChromagram(['D', 'F#', 'A']))
    expect(result).not.toBeNull()
    expect(result!.root).toBe('D')
    expect(result!.quality).toBe('major')
  })

  it('detects E major', () => {
    const result = detectChord(makeChromagram(['E', 'G#', 'B']))
    expect(result).not.toBeNull()
    expect(result!.root).toBe('E')
    expect(result!.quality).toBe('major')
  })

  it('detects A major', () => {
    const result = detectChord(makeChromagram(['A', 'C#', 'E']))
    expect(result).not.toBeNull()
    expect(result!.root).toBe('A')
    expect(result!.quality).toBe('major')
  })

  // Minor chords
  it('detects A minor', () => {
    const result = detectChord(makeChromagram(['A', 'C', 'E']))
    expect(result).not.toBeNull()
    expect(result!.root).toBe('A')
    expect(result!.quality).toBe('minor')
    expect(result!.name).toBe('Aminor')
  })

  it('detects E minor', () => {
    const result = detectChord(makeChromagram(['E', 'G', 'B']))
    expect(result).not.toBeNull()
    expect(result!.root).toBe('E')
    expect(result!.quality).toBe('minor')
  })

  it('detects D minor', () => {
    const result = detectChord(makeChromagram(['D', 'F', 'A']))
    expect(result).not.toBeNull()
    expect(result!.root).toBe('D')
    expect(result!.quality).toBe('minor')
  })

  // Seventh chords
  it('detects G7', () => {
    const result = detectChord(makeChromagram(['G', 'B', 'D', 'F']))
    expect(result).not.toBeNull()
    expect(result!.root).toBe('G')
    expect(result!.quality).toBe('7')
  })

  it('detects Am7', () => {
    const result = detectChord(makeChromagram(['A', 'C', 'E', 'G']))
    expect(result).not.toBeNull()
    expect(result!.root).toBe('A')
    expect(result!.quality).toBe('m7')
  })

  // With noise
  it('detects C major with background noise', () => {
    const chroma = makeChromagram(['C', 'E', 'G'])
    // Add small amounts of energy to non-chord tones
    for (let i = 0; i < 12; i++) {
      chroma[i] += 0.1
    }
    const result = detectChord(chroma)
    expect(result).not.toBeNull()
    expect(result!.root).toBe('C')
    expect(result!.quality).toBe('major')
  })

  // Power chord
  it('detects E5 power chord', () => {
    const result = detectChord(makeChromagram(['E', 'B']))
    expect(result).not.toBeNull()
    expect(result!.root).toBe('E')
    expect(result!.quality).toBe('5')
  })

  // Parametric: all 12 roots for major
  describe('detects major chord for all 12 roots', () => {
    const majorIntervals = [0, 4, 7]
    for (let root = 0; root < 12; root++) {
      const rootName = NOTE_NAMES[root]
      const notes = majorIntervals.map((i) => NOTE_NAMES[(root + i) % 12])
      it(`${rootName} major`, () => {
        const result = detectChord(makeChromagram(notes))
        expect(result).not.toBeNull()
        expect(result!.root).toBe(rootName)
        expect(result!.quality).toBe('major')
      })
    }
  })

  // Parametric: all 12 roots for minor
  describe('detects minor chord for all 12 roots', () => {
    const minorIntervals = [0, 3, 7]
    for (let root = 0; root < 12; root++) {
      const rootName = NOTE_NAMES[root]
      const notes = minorIntervals.map((i) => NOTE_NAMES[(root + i) % 12])
      it(`${rootName} minor`, () => {
        const result = detectChord(makeChromagram(notes))
        expect(result).not.toBeNull()
        expect(result!.root).toBe(rootName)
        expect(result!.quality).toBe('minor')
      })
    }
  })

  // Dominant root energy
  it('detects chord with doubled root energy', () => {
    const chroma = makeChromagram(['C', 'E', 'G'])
    chroma[NOTE_NAMES.indexOf('C')] = 2.0
    const result = detectChord(chroma)
    expect(result).not.toBeNull()
    expect(result!.root).toBe('C')
    expect(result!.quality).toBe('major')
  })

  // Ambiguous input
  it('returns null or low confidence for uniform energy', () => {
    const chroma = new Float32Array(12).fill(1.0)
    const result = detectChord(chroma)
    if (result !== null) {
      expect(result.confidence).toBeLessThan(0.5)
    }
  })

  // Confidence ordering
  it('clean triad has higher confidence than noisy one', () => {
    const clean = detectChord(makeChromagram(['C', 'E', 'G']))
    const noisy = makeChromagram(['C', 'E', 'G'])
    for (let i = 0; i < 12; i++) noisy[i] += 0.3
    const noisyResult = detectChord(noisy)

    expect(clean).not.toBeNull()
    expect(noisyResult).not.toBeNull()
    expect(clean!.confidence).toBeGreaterThan(noisyResult!.confidence)
  })

  // Diminished and augmented
  it('detects B diminished', () => {
    const result = detectChord(makeChromagram(['B', 'D', 'F']))
    expect(result).not.toBeNull()
    expect(result!.root).toBe('B')
    expect(result!.quality).toBe('dim')
  })

  it('detects C augmented', () => {
    const result = detectChord(makeChromagram(['C', 'E', 'G#']))
    expect(result).not.toBeNull()
    expect(result!.root).toBe('C')
    expect(result!.quality).toBe('aug')
  })

  // Sus chords
  it('detects Dsus2', () => {
    const result = detectChord(makeChromagram(['D', 'E', 'A']))
    expect(result).not.toBeNull()
    expect(result!.root).toBe('D')
    expect(result!.quality).toBe('sus2')
  })

  it('detects Csus4', () => {
    const result = detectChord(makeChromagram(['C', 'F', 'G']))
    expect(result).not.toBeNull()
    expect(result!.quality).toBe('sus4')
  })

  it('disambiguates sus4 vs sus2 by root energy', () => {
    // A-D-E: Asus4 when A is dominant, Dsus2 when D is dominant
    const chroma = makeChromagram(['A', 'D', 'E'])
    chroma[NOTE_NAMES.indexOf('A')] = 2.0
    const result = detectChord(chroma)
    expect(result).not.toBeNull()
    expect(result!.root).toBe('A')
    expect(result!.quality).toBe('sus4')

    const chroma2 = makeChromagram(['A', 'D', 'E'])
    chroma2[NOTE_NAMES.indexOf('D')] = 2.0
    const result2 = detectChord(chroma2)
    expect(result2).not.toBeNull()
    expect(result2!.root).toBe('D')
    expect(result2!.quality).toBe('sus2')
  })
})
