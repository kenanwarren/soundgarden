import type { GenreDefinition } from './learn-types'

export let GENRE_DEFINITIONS: GenreDefinition[] = []

export function _initGenreDefinitions(data: GenreDefinition[]): void {
  GENRE_DEFINITIONS = data
}
