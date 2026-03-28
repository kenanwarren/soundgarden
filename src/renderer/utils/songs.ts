import type { SongDefinition } from './learn-types'
import { normalizeSongDefinition } from './notation'

export let SONGS: SongDefinition[] = []

export function _initSongs(data: SongDefinition[]): void {
  SONGS = data.map(normalizeSongDefinition)
}
