import type { GenreId } from '../learn-types'

export interface ChordChangePreset {
  id: string
  name: string
  description: string
  chordNames: string[]
  genreTags: GenreId[]
  toneSuggestions?: string[]
}

export let CHORD_CHANGE_PRESETS: ChordChangePreset[] = []

export function _initChordChangePresets(data: ChordChangePreset[]): void {
  CHORD_CHANGE_PRESETS = data
}
