import type { PracticeDifficulty, SongArrangement, SongDefinition } from './learn-types'
import { normalizeSongDefinition } from './notation'

export let SONGS: SongDefinition[] = []

const DIFFICULTY_ORDER: PracticeDifficulty[] = ['Beginner', 'Developing', 'Intermediate']

function getDifficultyRank(difficulty: PracticeDifficulty): number {
  const index = DIFFICULTY_ORDER.indexOf(difficulty)
  return index === -1 ? DIFFICULTY_ORDER.length : index
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
    notation: song.notation
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
  difficulty: PracticeDifficulty | 'all'
): boolean {
  if (difficulty === 'all') return true
  return getSongArrangements(song).some((arrangement) => arrangement.difficulty === difficulty)
}

export function getSongDifficultyLabel(song: SongDefinition): string {
  const difficulties = [
    ...new Set(getSongArrangements(song).map((arrangement) => arrangement.difficulty))
  ].sort((left, right) => getDifficultyRank(left) - getDifficultyRank(right))

  if (difficulties.length <= 1) return difficulties[0] ?? song.difficulty
  return `${difficulties[0]} to ${difficulties[difficulties.length - 1]}`
}

export function getPreferredSongArrangement(
  song: SongDefinition,
  difficulty: PracticeDifficulty | 'all' = 'all',
  arrangementId?: string | null
): SongArrangement | null {
  const arrangements = getSongArrangements(song)
  if (arrangements.length === 0) return null

  if (arrangementId) {
    const selected = arrangements.find((arrangement) => arrangement.id === arrangementId)
    if (selected) return selected
  }

  if (difficulty !== 'all') {
    const match = arrangements.find((arrangement) => arrangement.difficulty === difficulty)
    if (match) return match
  }

  return arrangements[0]
}
