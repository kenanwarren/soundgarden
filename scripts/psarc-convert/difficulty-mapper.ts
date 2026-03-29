import type {
  DifficultyGrade,
  DifficultyTier,
  PracticeDifficulty
} from '../../src/renderer/utils/learn-types'
import type { SngAnchor, SngChordTemplate, SngData, SngNoteData } from './types'
import { buildBeatGrid } from './beat-grid'
import type { GridMeasure } from './beat-grid'

export type ArrangementType = 'lead' | 'rhythm' | 'bass'

interface DifficultyLevel {
  rsLevel: number
  difficulty: PracticeDifficulty
}

export interface DifficultyMetrics {
  noteDensity: number
  tempoComplexity: number
  techniqueUsage: number
  fretMovement: number
  chordComplexity: number
  stringCrossing: number
}

const MASK_HAMMER_ON = 0x0002
const MASK_PULL_OFF = 0x0004
const MASK_HARMONIC = 0x0008
const MASK_BEND = 0x0010
const MASK_MUTE = 0x0020
const MASK_PALM_MUTE = 0x0040
const MASK_SLIDE = 0x0080
const MASK_ACCENT = 0x2000
const MASK_SLIDE_UNPITCH = 0x2000_0000

const TECHNIQUE_WEIGHTS: Array<[number, number]> = [
  [MASK_BEND, 3],
  [MASK_HARMONIC, 2],
  [MASK_SLIDE, 2],
  [MASK_SLIDE_UNPITCH, 2],
  [MASK_HAMMER_ON, 1],
  [MASK_PULL_OFF, 1],
  [MASK_PALM_MUTE, 1],
  [MASK_MUTE, 0.5],
  [MASK_ACCENT, 0.5]
]

const METRIC_WEIGHTS = {
  noteDensity: 0.25,
  tempoComplexity: 0.2,
  techniqueUsage: 0.2,
  fretMovement: 0.15,
  chordComplexity: 0.12,
  stringCrossing: 0.08
}

const TYPE_BIAS: Record<ArrangementType, number> = {
  rhythm: -0.05,
  lead: 0.05,
  bass: 0.0
}

const SCORE_THRESHOLDS = [0.08, 0.18, 0.3, 0.42, 0.54, 0.66, 0.78, 0.9]

const SHORT_SONG_THRESHOLD = 10

export function sampleDifficultyLevels(
  sngData: SngData,
  arrangementType: ArrangementType,
  baseDifficulty?: PracticeDifficulty
): DifficultyLevel[] {
  const maxDifficulty = getMaxDifficulty(sngData)
  if (maxDifficulty < 0) return []

  const sampledLevels: number[] = []
  if (maxDifficulty === 0) {
    sampledLevels.push(0)
  } else if (maxDifficulty === 1) {
    sampledLevels.push(0, 1)
  } else {
    sampledLevels.push(0, Math.floor(maxDifficulty / 2), maxDifficulty)
  }

  if (baseDifficulty) {
    return mapWithBase(sampledLevels, baseDifficulty)
  }

  const grid = buildBeatGrid(sngData.beats)
  let prevRank = -1

  return sampledLevels.map((rsLevel) => {
    const level = sngData.arrangements.find((a) => a.difficulty === rsLevel)
    const notes = level?.notes ?? []
    const anchors = level?.anchors ?? []

    const { score } = computeDifficultyScore(
      notes,
      anchors,
      sngData.chordTemplates,
      grid,
      arrangementType
    )

    let rank = scoreToRank(score)
    if (rank <= prevRank) {
      rank = Math.min(prevRank + 1, 8)
    }
    prevRank = rank

    return { rsLevel, difficulty: rankToDifficulty(rank) }
  })
}

function getMaxDifficulty(sngData: SngData): number {
  let max = -1
  for (const phrase of sngData.phrases) {
    if (phrase.maxDifficulty > max) max = phrase.maxDifficulty
  }
  for (const arr of sngData.arrangements) {
    if (arr.difficulty > max) max = arr.difficulty
  }
  return max
}

export function computeDifficultyScore(
  notes: SngNoteData[],
  anchors: SngAnchor[],
  chordTemplates: SngChordTemplate[],
  grid: GridMeasure[],
  arrangementType: ArrangementType
): { score: number; metrics: DifficultyMetrics } {
  if (notes.length === 0) {
    const empty: DifficultyMetrics = {
      noteDensity: 0,
      tempoComplexity: 0,
      techniqueUsage: 0,
      fretMovement: 0,
      chordComplexity: 0,
      stringCrossing: 0
    }
    return { score: 0, metrics: empty }
  }

  const effectiveDuration = getEffectiveDuration(notes, 4)
  const isShort = effectiveDuration < SHORT_SONG_THRESHOLD

  const metrics: DifficultyMetrics = {
    noteDensity: computeNoteDensity(notes, effectiveDuration),
    tempoComplexity: computeTempoComplexity(notes, grid),
    techniqueUsage: computeTechniqueScore(notes),
    fretMovement: computeFretMovement(notes, anchors),
    chordComplexity: computeChordComplexity(notes, chordTemplates),
    stringCrossing: computeStringCrossing(notes)
  }

  const densityWeight = isShort ? METRIC_WEIGHTS.noteDensity * 0.5 : METRIC_WEIGHTS.noteDensity
  const redistributed = isShort ? METRIC_WEIGHTS.noteDensity * 0.5 : 0
  const otherScale = redistributed > 0 ? 1 + redistributed / (1 - METRIC_WEIGHTS.noteDensity) : 1

  const raw =
    metrics.noteDensity * densityWeight +
    metrics.tempoComplexity * METRIC_WEIGHTS.tempoComplexity * otherScale +
    metrics.techniqueUsage * METRIC_WEIGHTS.techniqueUsage * otherScale +
    metrics.fretMovement * METRIC_WEIGHTS.fretMovement * otherScale +
    metrics.chordComplexity * METRIC_WEIGHTS.chordComplexity * otherScale +
    metrics.stringCrossing * METRIC_WEIGHTS.stringCrossing * otherScale

  const score = clamp01(raw + TYPE_BIAS[arrangementType])

  return { score, metrics }
}

export function computeNoteDensity(notes: SngNoteData[], effectiveDuration: number): number {
  if (effectiveDuration <= 0) return 0
  const nps = notes.length / effectiveDuration
  return clamp01(nps / 6)
}

export function computeTempoComplexity(notes: SngNoteData[], grid: GridMeasure[]): number {
  if (notes.length === 0 || grid.length === 0) return 0

  const avgTempo = grid.reduce((s, m) => s + m.tempo, 0) / grid.length
  const totalBeats = grid.reduce((s, m) => s + m.beatsInMeasure, 0)
  const totalDuration = grid[grid.length - 1].endTime - grid[0].startTime
  const beatsPerSecond = totalDuration > 0 ? totalBeats / totalDuration : 2

  const notesPerBeat = beatsPerSecond > 0 ? notes.length / (totalDuration * beatsPerSecond) : 0
  const effectiveSpeed = avgTempo * notesPerBeat

  return clamp01(Math.log(effectiveSpeed + 1) / Math.log(601))
}

export function computeTechniqueScore(notes: SngNoteData[]): number {
  if (notes.length === 0) return 0

  let totalPoints = 0
  for (const note of notes) {
    const mask = note.mask
    for (const [flag, weight] of TECHNIQUE_WEIGHTS) {
      if (mask & flag) totalPoints += weight
    }
    if (note.vibrato > 0) totalPoints += 2
  }

  const avgPoints = totalPoints / notes.length
  return clamp01(avgPoints / 3)
}

export function computeFretMovement(notes: SngNoteData[], anchors: SngAnchor[]): number {
  if (notes.length === 0) return 0

  // Fret span
  let minFret = Infinity
  let maxFret = -Infinity
  for (const note of notes) {
    if (note.fret < 0) continue
    if (note.fret < minFret) minFret = note.fret
    if (note.fret > maxFret) maxFret = note.fret
  }
  const fretSpan = maxFret >= minFret ? maxFret - minFret : 0
  const spanNorm = clamp01((fretSpan - 3) / 17)

  // Anchor movement rate
  let anchorChanges = 0
  for (let i = 1; i < anchors.length; i++) {
    if (anchors[i].fret !== anchors[i - 1].fret) anchorChanges++
  }
  const duration =
    anchors.length > 1 ? anchors[anchors.length - 1].endTime - anchors[0].startTime : 0
  const anchorRate = duration > 0 ? anchorChanges / duration : 0
  const anchorNorm = clamp01(anchorRate)

  return 0.4 * spanNorm + 0.6 * anchorNorm
}

export function computeChordComplexity(
  notes: SngNoteData[],
  chordTemplates: SngChordTemplate[]
): number {
  if (notes.length === 0 || chordTemplates.length === 0) return 0

  let chordNoteCount = 0
  let totalStrings = 0
  let barreCount = 0
  let totalChords = 0

  const seenChords = new Set<number>()
  for (const note of notes) {
    if (note.chordId < 0 || note.chordId >= chordTemplates.length) continue

    chordNoteCount++
    if (seenChords.has(note.chordId)) continue
    seenChords.add(note.chordId)

    const tmpl = chordTemplates[note.chordId]
    const stringsUsed = tmpl.frets.filter((f) => f >= 0).length
    totalStrings += stringsUsed
    totalChords++

    // Barre detection: one finger covers multiple strings at the same fret
    const fingerStrings = new Map<number, number>()
    for (let s = 0; s < tmpl.fingers.length; s++) {
      if (tmpl.fingers[s] > 0 && tmpl.frets[s] > 0) {
        fingerStrings.set(tmpl.fingers[s], (fingerStrings.get(tmpl.fingers[s]) ?? 0) + 1)
      }
    }
    for (const [, count] of fingerStrings) {
      if (count >= 2) {
        barreCount++
        break
      }
    }
  }

  if (totalChords === 0) return 0

  const chordFrequency = chordNoteCount / notes.length
  const avgStrings = totalStrings / totalChords
  const barreRatio = barreCount / totalChords

  return clamp01(chordFrequency * (avgStrings / 6) * (1 + 0.5 * barreRatio))
}

export function computeStringCrossing(notes: SngNoteData[]): number {
  if (notes.length < 2) return 0

  let totalCrossing = 0
  for (let i = 1; i < notes.length; i++) {
    totalCrossing += Math.abs(notes[i].string - notes[i - 1].string)
  }
  const avg = totalCrossing / (notes.length - 1)
  return clamp01(avg / 3)
}

export function getEffectiveDuration(notes: SngNoteData[], maxGap: number): number {
  if (notes.length < 2) return notes.length > 0 ? Math.max(notes[0].sustain, 0.5) : 0

  let duration = 0
  for (let i = 1; i < notes.length; i++) {
    const gap = notes[i].time - notes[i - 1].time
    duration += Math.min(gap, maxGap)
  }
  // Add sustain of last note
  duration += Math.min(notes[notes.length - 1].sustain, maxGap)
  return Math.max(duration, 0.5)
}

export function scoreToRank(score: number): number {
  for (let i = 0; i < SCORE_THRESHOLDS.length; i++) {
    if (score < SCORE_THRESHOLDS[i]) return i
  }
  return 8
}

function mapWithBase(sampledLevels: number[], base: PracticeDifficulty): DifficultyLevel[] {
  const baseRank = tierRank(base.tier) * 3 + (base.grade - 1)

  return sampledLevels.map((rsLevel, i) => {
    const rank = Math.min(baseRank + i, 8)
    return { rsLevel, difficulty: rankToDifficulty(rank) }
  })
}

function tierRank(tier: DifficultyTier): number {
  if (tier === 'Beginner') return 0
  if (tier === 'Intermediate') return 1
  return 2
}

export function rankToDifficulty(rank: number): PracticeDifficulty {
  const clamped = Math.max(0, Math.min(8, rank))
  const tierIndex = Math.floor(clamped / 3)
  const grade = (clamped % 3) + 1
  const tiers: DifficultyTier[] = ['Beginner', 'Intermediate', 'Advanced']
  return { tier: tiers[tierIndex], grade: grade as DifficultyGrade }
}

export function parseDifficultyArg(arg: string): PracticeDifficulty | null {
  const match = arg.match(/^(Beginner|Intermediate|Advanced)\s+([123])$/)
  if (!match) return null
  return { tier: match[1] as DifficultyTier, grade: parseInt(match[2], 10) as DifficultyGrade }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}
