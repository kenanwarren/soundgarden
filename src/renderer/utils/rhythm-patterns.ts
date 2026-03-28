import type { GenreId } from './learn-types'

export interface RhythmPattern {
  name: string
  description: string
  difficulty: 1 | 2 | 3
  beatsPerMeasure: number
  subdivisions: number
  hits: boolean[]
  genreTags?: GenreId[]
}

export let RHYTHM_PATTERNS: RhythmPattern[] = []

export function _initRhythmPatterns(data: RhythmPattern[]): void {
  RHYTHM_PATTERNS = data
}
