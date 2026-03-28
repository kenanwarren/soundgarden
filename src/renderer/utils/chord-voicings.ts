export interface ChordVoicing {
  name: string
  root: string
  quality: string
  frets: (number | null)[]
  fingers: (number | null)[]
  barres: { fret: number; fromString: number; toString: number }[]
  category: 'open' | 'barre' | 'extended'
}

export let CHORD_VOICINGS: ChordVoicing[] = []

export function _initChordVoicings(data: ChordVoicing[]): void {
  CHORD_VOICINGS = data
}
