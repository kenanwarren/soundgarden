const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Standard guitar tuning as MIDI note numbers (string 0 = low E, Rocksmith convention)
const STANDARD_TUNING_MIDI = [40, 45, 50, 55, 59, 64] // E2, A2, D3, G3, B3, E4

// Known tuning offset patterns → human-readable names
const TUNING_NAMES: Array<{ offsets: number[]; name: string }> = [
  { offsets: [0, 0, 0, 0, 0, 0], name: 'Standard' },
  { offsets: [-2, 0, 0, 0, 0, 0], name: 'Drop D' },
  { offsets: [-2, -2, -2, -2, -2, -2], name: 'D Standard' },
  { offsets: [-1, -1, -1, -1, -1, -1], name: 'Eb Standard' },
  { offsets: [-4, -4, -4, -4, -4, -4], name: 'C Standard' },
  { offsets: [-2, -2, -2, -2, -2, -4], name: 'Drop C' },
  { offsets: [-5, 0, 0, 0, 0, 0], name: 'Drop A' },
  { offsets: [-2, -2, -1, 0, -2, -2], name: 'Open G' },
  { offsets: [-2, 0, 0, -1, 0, 0], name: 'DADGAD' },
  { offsets: [0, 0, 2, 2, 2, 0], name: 'Open A' },
  { offsets: [-2, 0, 0, -1, -2, -2], name: 'Open D' },
  { offsets: [0, 0, 0, 0, 1, 0], name: 'Open E' },
]

export interface TuningInfo {
  offsets: number[]
  name: string
}

export function parseTuning(tuning: {
  string0: number
  string1: number
  string2: number
  string3: number
  string4: number
  string5: number
}): TuningInfo {
  const offsets = [
    tuning.string0,
    tuning.string1,
    tuning.string2,
    tuning.string3,
    tuning.string4,
    tuning.string5,
  ]

  const match = TUNING_NAMES.find(
    (t) => t.offsets.length === offsets.length && t.offsets.every((o, i) => o === offsets[i])
  )

  return {
    offsets,
    name: match?.name ?? formatTuningOffsets(offsets),
  }
}

function formatTuningOffsets(offsets: number[]): string {
  const noteNames = offsets.map((offset, i) => {
    const midi = STANDARD_TUNING_MIDI[i] + offset
    return NOTE_NAMES[midi % 12]
  })
  return noteNames.join(' ')
}

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  const note = NOTE_NAMES[midi % 12]
  return `${note}${octave}`
}

export function fretToMidi(
  stringIndex: number,
  fret: number,
  tuningOffsets: number[],
  capo: number = 0
): number {
  const openMidi = STANDARD_TUNING_MIDI[stringIndex] + (tuningOffsets[stringIndex] ?? 0)
  return openMidi + fret + capo
}

export function fretToPitch(
  stringIndex: number,
  fret: number,
  tuningOffsets: number[],
  capo: number = 0
): string {
  return midiToNoteName(fretToMidi(stringIndex, fret, tuningOffsets, capo))
}

// Rocksmith uses string 0 = low E; our tab uses string 0 = high E
export function rsStringToTabString(rsString: number): number {
  return 5 - rsString
}

export function chordRoot(chordName: string): string {
  // Extract root note from chord name: "Am7" → "Am", "C#5" → "C#", "Dmin" → "D"
  const match = chordName.match(/^([A-G][#b]?)(m(?:in|aj)?|min|Maj|Min|sus|dim|aug|add|5|6|7|9|11|13)?/)
  if (!match) return chordName
  const root = match[1]
  const quality = match[2] ?? ''
  // Return root + minor indicator only
  if (quality === 'm' || quality === 'min' || quality === 'Min') return `${root}m`
  return root
}

export function detectKey(
  chordNames: string[],
  sectionChords: Array<{ section: string; chords: string[] }>
): string {
  if (chordNames.length === 0) return 'C'

  // Use root notes for key detection
  const rootNames = chordNames.map(chordRoot)

  // Heuristic: first chord of first and last non-empty sections
  const nonEmpty = sectionChords.filter((s) => s.chords.length > 0)
  const candidates: string[] = []

  if (nonEmpty.length > 0) {
    candidates.push(chordRoot(nonEmpty[0].chords[0]))
    candidates.push(chordRoot(nonEmpty[nonEmpty.length - 1].chords[0]))
  }

  // Most frequent root note overall
  const freq = new Map<string, number>()
  for (const name of rootNames) {
    freq.set(name, (freq.get(name) ?? 0) + 1)
  }
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1])
  if (sorted.length > 0) candidates.push(sorted[0][0])

  // Pick the most common candidate
  const candidateFreq = new Map<string, number>()
  for (const c of candidates) {
    candidateFreq.set(c, (candidateFreq.get(c) ?? 0) + 1)
  }
  let best = candidates[0]
  let bestCount = 0
  for (const [name, count] of candidateFreq) {
    if (count > bestCount) {
      best = name
      bestCount = count
    }
  }

  return best ?? 'C'
}
