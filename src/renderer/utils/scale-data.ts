import { NOTE_NAMES } from './constants'

export interface ScaleDefinition {
  name: string
  intervals: number[]
  category: 'pentatonic' | 'diatonic' | 'modal' | 'blues'
}

export let SCALES: ScaleDefinition[] = []

export function _initScales(data: ScaleDefinition[]): void {
  SCALES = data
}

export function getScaleNotes(root: string, scale: ScaleDefinition): string[] {
  const rootIndex = NOTE_NAMES.indexOf(root)
  if (rootIndex === -1) return []
  return scale.intervals.map((interval) => NOTE_NAMES[(rootIndex + interval) % 12])
}
