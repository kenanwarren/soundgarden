export let NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const DEFAULT_A4_FREQUENCY = 440

export let TUNING_PRESETS: Record<string, string[]> = {}

export const IN_TUNE_THRESHOLD = 5 // cents
export const CLOSE_TUNE_THRESHOLD = 15 // cents

export function _initConstants(
  noteNames: string[],
  tuningPresets: Record<string, string[]>
): void {
  NOTE_NAMES = noteNames
  TUNING_PRESETS = tuningPresets
}
