import type { GenreId } from '../learn-types'
import type { ScaleSequenceType } from '../learn-drills'

export interface ScaleSequencePreset {
  id: string
  name: string
  description: string
  root: string
  scaleName: string
  sequenceType: ScaleSequenceType
  loops: number
  genreTags: GenreId[]
}

export let SCALE_SEQUENCE_PRESETS: ScaleSequencePreset[] = []

export function _initScaleSequencePresets(data: ScaleSequencePreset[]): void {
  SCALE_SEQUENCE_PRESETS = data
}
