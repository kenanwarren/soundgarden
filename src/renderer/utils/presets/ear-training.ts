import type { GenreId } from '../learn-types'

export interface EarTrainingPreset {
  id: string
  name: string
  description: string
  promptLabel: string
  mode: 'note' | 'interval'
  genreTags: GenreId[]
  allowedSemitones?: number[]
  referenceNotes?: string[]
}

export let EAR_TRAINING_PRESETS: EarTrainingPreset[] = []

export function _initEarTrainingPresets(data: EarTrainingPreset[]): void {
  EAR_TRAINING_PRESETS = data
}
