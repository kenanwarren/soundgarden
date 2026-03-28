import type { SongDefinition } from './learn-types'

export let SONGS: SongDefinition[] = []

export function _initSongs(data: SongDefinition[]): void {
  SONGS = data
}
