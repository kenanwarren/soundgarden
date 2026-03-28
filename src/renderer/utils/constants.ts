export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const DEFAULT_A4_FREQUENCY = 440

export const TUNING_PRESETS: Record<string, string[]> = {
  Standard: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  'Drop D': ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  DADGAD: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'],
  'Open G': ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
  'Open D': ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'],
  'Half Step Down': ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4']
}

export const IN_TUNE_THRESHOLD = 5 // cents
export const CLOSE_TUNE_THRESHOLD = 15 // cents
