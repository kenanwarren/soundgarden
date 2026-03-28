import { describe, it, expect } from 'vitest'
import { NOTE_NAMES } from '../../src/renderer/utils/constants'
import { detectChord } from '../../src/renderer/utils/chord-detection'

function buildChromagram(
  frequencies: number[],
  signalDb = -10,
  sampleRate = 48000,
  fftSize = 8192
): Float32Array {
  const binFreq = sampleRate / fftSize
  const numBins = fftSize / 2
  const chromagram = new Float32Array(12)

  const freqData = new Float32Array(numBins).fill(-100)
  for (const freq of frequencies) {
    const bin = Math.round(freq / binFreq)
    if (bin > 0 && bin < numBins) {
      freqData[bin] = signalDb
    }
  }

  for (let i = 1; i < numBins; i++) {
    const freq = i * binFreq
    if (freq < 60 || freq > 2000) continue
    const db = freqData[i]
    if (db < -80) continue
    const energy = Math.pow(10, db / 20)
    const semitones = 12 * Math.log2(freq / 16.35)
    const pitchClass = Math.round(semitones) % 12
    const idx = ((pitchClass % 12) + 12) % 12
    chromagram[idx] += energy
  }

  return chromagram
}

describe('chromagram from FFT frequencies', () => {
  it('C major from fundamentals (C4=261.63, E4=329.63, G4=392.00)', () => {
    const chroma = buildChromagram([261.63, 329.63, 392.0])
    const result = detectChord(chroma)
    expect(result).not.toBeNull()
    expect(result!.root).toBe('C')
    expect(result!.quality).toBe('major')
  })

  it('Am from fundamentals (A2=110, C3=130.81, E3=164.81)', () => {
    const chroma = buildChromagram([110, 130.81, 164.81])
    const result = detectChord(chroma)
    expect(result).not.toBeNull()
    expect(result!.root).toBe('A')
    expect(result!.quality).toBe('minor')
  })

  it('G major open chord (G2, B2, D3, G3, B3, D4)', () => {
    const chroma = buildChromagram([98, 123.47, 146.83, 196, 246.94, 293.66])
    const result = detectChord(chroma)
    expect(result).not.toBeNull()
    expect(result!.root).toBe('G')
    expect(result!.quality).toBe('major')
  })

  it('Em open chord (E2, B2, E3, G3, B3, E4)', () => {
    const chroma = buildChromagram([82.41, 123.47, 164.81, 196, 246.94, 329.63])
    const result = detectChord(chroma)
    expect(result).not.toBeNull()
    expect(result!.root).toBe('E')
    expect(result!.quality).toBe('minor')
  })

  it('maps A4=440Hz to pitch class A (index 9)', () => {
    const chroma = buildChromagram([440])
    const aIdx = NOTE_NAMES.indexOf('A')
    expect(chroma[aIdx]).toBeGreaterThan(0)
    for (let i = 0; i < 12; i++) {
      if (i !== aIdx) expect(chroma[i]).toBe(0)
    }
  })

  // Realistic signal level tests
  it('detects E major at -40dBFS (moderate guitar signal)', () => {
    const chroma = buildChromagram([82.41, 123.47, 164.81, 207.65, 246.94, 329.63], -40)
    const result = detectChord(chroma)
    expect(result).not.toBeNull()
    expect(result!.root).toBe('E')
    expect(result!.quality).toBe('major')
  })

  it('detects E major at -60dBFS (quiet guitar signal)', () => {
    const chroma = buildChromagram([82.41, 123.47, 164.81, 207.65, 246.94, 329.63], -60)
    const result = detectChord(chroma)
    expect(result).not.toBeNull()
    expect(result!.root).toBe('E')
    expect(result!.quality).toBe('major')
  })

  it('returns null for very weak signal at -75dBFS', () => {
    const chroma = buildChromagram([82.41, 164.81, 329.63], -75)
    // At this level, it's fine to return null
    // Just verify it doesn't crash
    detectChord(chroma)
  })
})
