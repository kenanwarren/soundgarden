import type {
  DifficultyTier,
  PracticeDifficulty,
  SongArrangement,
  SongDefinition
} from './learn-types'
import { normalizeSongDefinition } from './notation'

export let SONGS: SongDefinition[] = []

const TIER_ORDER: DifficultyTier[] = ['Beginner', 'Intermediate', 'Advanced']

export function getDifficultyRank(difficulty: PracticeDifficulty): number {
  const tierIndex = TIER_ORDER.indexOf(difficulty.tier)
  return (tierIndex === -1 ? TIER_ORDER.length : tierIndex) * 3 + (difficulty.grade - 1)
}

export function formatDifficulty(difficulty: PracticeDifficulty): string {
  return `${difficulty.tier} ${difficulty.grade}`
}

function toSongArrangement(song: SongDefinition, isDefault = true): SongArrangement {
  return {
    id: song.id,
    label: isDefault ? (song.variantLabel ?? 'Standard') : (song.variantLabel ?? song.title),
    isDefault,
    difficulty: song.difficulty,
    key: song.key,
    chords: song.chords,
    attribution: song.attribution,
    lines: song.lines,
    notation: song.notation,
    tuning: song.tuning,
    capo: song.capo
  }
}

function sortArrangements(arrangements: SongArrangement[]): SongArrangement[] {
  return [...arrangements].sort((left, right) => {
    const difficultyDiff = getDifficultyRank(left.difficulty) - getDifficultyRank(right.difficulty)
    if (difficultyDiff !== 0) return difficultyDiff
    if (left.isDefault !== right.isDefault) return left.isDefault ? -1 : 1
    return left.label.localeCompare(right.label)
  })
}

function mergeGenres(song: SongDefinition, variants: SongDefinition[]): SongDefinition['genres'] {
  return [...new Set([song, ...variants].flatMap((entry) => entry.genres))]
}

export function buildSongCatalog(data: SongDefinition[]): SongDefinition[] {
  const normalized = data.map(normalizeSongDefinition)
  const songsById = new Map(normalized.map((song) => [song.id, song]))
  const variantsByBase = new Map<string, SongDefinition[]>()

  for (const song of normalized) {
    if (!song.variantOf || !songsById.has(song.variantOf)) continue
    const variants = variantsByBase.get(song.variantOf) ?? []
    variants.push(song)
    variantsByBase.set(song.variantOf, variants)
  }

  return normalized
    .filter((song) => !song.variantOf || !songsById.has(song.variantOf))
    .map((song) => {
      const variants = variantsByBase.get(song.id) ?? []

      return {
        ...song,
        genres: mergeGenres(song, variants),
        arrangements: sortArrangements([
          toSongArrangement(song, true),
          ...variants.map((variant) => toSongArrangement(variant, false))
        ])
      }
    })
}

export function _initSongs(data: SongDefinition[]): void {
  SONGS = buildSongCatalog(data)
}

export function getSongArrangements(song: SongDefinition): SongArrangement[] {
  return song.arrangements?.length ? song.arrangements : [toSongArrangement(song, true)]
}

export function songMatchesDifficulty(
  song: SongDefinition,
  difficulty: DifficultyTier | 'all'
): boolean {
  if (difficulty === 'all') return true
  return getSongArrangements(song).some((arrangement) => arrangement.difficulty.tier === difficulty)
}

export function getSongDifficultyLabel(song: SongDefinition): string {
  const sorted = getSongArrangements(song)
    .map((a) => a.difficulty)
    .sort((a, b) => getDifficultyRank(a) - getDifficultyRank(b))

  const uniqueLabels = [...new Set(sorted.map(formatDifficulty))]
  if (uniqueLabels.length <= 1) return uniqueLabels[0] ?? formatDifficulty(song.difficulty)
  return `${uniqueLabels[0]} to ${uniqueLabels[uniqueLabels.length - 1]}`
}

export function getPreferredSongArrangement(
  song: SongDefinition,
  difficulty: DifficultyTier | 'all' = 'all',
  arrangementId?: string | null
): SongArrangement | null {
  const arrangements = getSongArrangements(song)
  if (arrangements.length === 0) return null

  if (arrangementId) {
    const selected = arrangements.find((arrangement) => arrangement.id === arrangementId)
    if (selected) return selected
  }

  if (difficulty !== 'all') {
    const match = arrangements.find((arrangement) => arrangement.difficulty.tier === difficulty)
    if (match) return match
  }

  return arrangements[0]
}
