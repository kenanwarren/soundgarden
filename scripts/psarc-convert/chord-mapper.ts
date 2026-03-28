import type { SngChordTemplate } from './types'

// Suffixes Rocksmith appends for technique variants
const TECHNIQUE_SUFFIXES = ['-arp', '-nop', '-strum', '-str', '-palm', '-accent']

export function normalizeChordName(name: string): string {
  if (!name) return ''

  let normalized = name.trim()

  // Strip technique suffixes
  for (const suffix of TECHNIQUE_SUFFIXES) {
    if (normalized.toLowerCase().endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length)
    }
  }

  // Strip trailing numbers that Rocksmith adds for duplicate chord shapes (e.g. "Am2", "G3")
  // but preserve legitimate suffixes like "7", "9", "11", "13", "6", "5"
  const trailingNum = normalized.match(/^(.+?)(\d)$/)
  if (trailingNum) {
    const base = trailingNum[1]
    const digit = trailingNum[2]
    // Only strip if it looks like a duplicate marker (base already has chord quality)
    const hasQuality = /[a-z]/.test(base.slice(-1)) || base.endsWith('#') || base.endsWith('b')
    if (hasQuality && !['5', '6', '7', '9'].includes(digit)) {
      normalized = base
    }
  }

  return normalized
}

export interface ChordMapping {
  uniqueChords: string[]
  chordIdToName: Map<number, string>
}

export function buildChordMapping(templates: SngChordTemplate[]): ChordMapping {
  const chordIdToName = new Map<number, string>()
  const seen = new Set<string>()
  const uniqueChords: string[] = []

  for (let i = 0; i < templates.length; i++) {
    const name = normalizeChordName(templates[i].name)
    if (!name) continue

    chordIdToName.set(i, name)

    if (!seen.has(name)) {
      seen.add(name)
      uniqueChords.push(name)
    }
  }

  return { uniqueChords, chordIdToName }
}

export function getChordAtTime(
  time: number,
  chordEvents: Array<{ time: number; chordId: number }>,
  chordIdToName: Map<number, string>
): string | null {
  // Find the most recent chord at or before this time
  let best: string | null = null
  for (const event of chordEvents) {
    if (event.time <= time + 0.01) {
      best = chordIdToName.get(event.chordId) ?? null
    } else {
      break
    }
  }
  return best
}
