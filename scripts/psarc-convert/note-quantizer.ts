import type { NoteDuration } from '../../src/renderer/utils/learn-types'
import type { GridMeasure } from './beat-grid'
import { findMeasureAtTime } from './beat-grid'

interface QuantizedDuration {
  duration: NoteDuration
  dotted?: boolean
}

// Duration specs in descending order of beat length
const DURATION_SPECS: Array<QuantizedDuration & { beats: number }> = [
  { duration: 'whole', dotted: true, beats: 6 },
  { duration: 'whole', beats: 4 },
  { duration: 'half', dotted: true, beats: 3 },
  { duration: 'half', beats: 2 },
  { duration: 'quarter', dotted: true, beats: 1.5 },
  { duration: 'quarter', beats: 1 },
  { duration: 'eighth', dotted: true, beats: 0.75 },
  { duration: 'eighth', beats: 0.5 },
  { duration: 'sixteenth', dotted: true, beats: 0.375 },
  { duration: 'sixteenth', beats: 0.25 },
  { duration: 'thirtySecond', beats: 0.125 },
]

const SNAP_TOLERANCE = 0.20

export function quantizeDuration(
  durationSeconds: number,
  beatDuration: number
): QuantizedDuration {
  if (beatDuration <= 0) return { duration: 'quarter' }

  const durationInBeats = durationSeconds / beatDuration

  // Find closest match
  let bestMatch = DURATION_SPECS[DURATION_SPECS.length - 1]
  let bestError = Infinity

  for (const spec of DURATION_SPECS) {
    const error = Math.abs(durationInBeats - spec.beats) / spec.beats
    if (error < bestError) {
      bestError = error
      bestMatch = spec
    }
  }

  if (bestError > SNAP_TOLERANCE) {
    // Fall back to nearest without dotted
    const simpleDurations = DURATION_SPECS.filter((s) => !s.dotted)
    bestMatch = simpleDurations[simpleDurations.length - 1]
    bestError = Infinity
    for (const spec of simpleDurations) {
      const error = Math.abs(durationInBeats - spec.beats) / spec.beats
      if (error < bestError) {
        bestError = error
        bestMatch = spec
      }
    }
  }

  return {
    duration: bestMatch.duration,
    ...(bestMatch.dotted ? { dotted: true } : {}),
  }
}

export interface TimedNote {
  time: number
  sustain: number
}

export interface QuantizedNote {
  measureIndex: number
  duration: NoteDuration
  dotted?: boolean
}

export function quantizeNoteInGrid(
  note: TimedNote,
  grid: GridMeasure[]
): QuantizedNote | null {
  const measure = findMeasureAtTime(grid, note.time)
  if (!measure) return null

  const measureIndex = grid.indexOf(measure)
  const sustainTime = note.sustain > 0 ? note.sustain : measure.beatDuration
  const quantized = quantizeDuration(sustainTime, measure.beatDuration)

  return {
    measureIndex,
    duration: quantized.duration,
    ...(quantized.dotted ? { dotted: true } : {}),
  }
}

export function computeNoteSustain(
  noteTime: number,
  noteSustain: number,
  nextNoteTime: number | null,
  beatDuration: number
): number {
  // If sustain is specified and non-zero, use it
  if (noteSustain > 0.01) return noteSustain

  // Otherwise estimate from gap to next note, capped at one beat
  if (nextNoteTime !== null) {
    const gap = nextNoteTime - noteTime
    return Math.min(gap, beatDuration)
  }

  return beatDuration
}
