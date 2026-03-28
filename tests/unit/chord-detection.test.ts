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
})
