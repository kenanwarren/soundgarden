export interface ChordVoicing {
  name: string
  root: string
  quality: string
  frets: (number | null)[]
  fingers: (number | null)[]
  barres: { fret: number; fromString: number; toString: number }[]
  category: 'open' | 'barre' | 'extended'
}

export const CHORD_VOICINGS: ChordVoicing[] = [
  // Open Major Chords
  {
    name: 'C',
    root: 'C',
    quality: 'major',
    frets: [null, 3, 2, 0, 1, 0],
    fingers: [null, 3, 2, 0, 1, 0],
    barres: [],
    category: 'open'
  },
  {
    name: 'D',
    root: 'D',
    quality: 'major',
    frets: [null, null, 0, 2, 3, 2],
    fingers: [null, null, 0, 1, 3, 2],
    barres: [],
    category: 'open'
  },
  {
    name: 'E',
    root: 'E',
    quality: 'major',
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
    barres: [],
    category: 'open'
  },
  {
    name: 'G',
    root: 'G',
    quality: 'major',
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
    barres: [],
    category: 'open'
  },
  {
    name: 'A',
    root: 'A',
    quality: 'major',
    frets: [null, 0, 2, 2, 2, 0],
    fingers: [null, 0, 1, 2, 3, 0],
    barres: [],
    category: 'open'
  },

  // Open Minor Chords
  {
    name: 'Am',
    root: 'A',
    quality: 'minor',
    frets: [null, 0, 2, 2, 1, 0],
    fingers: [null, 0, 2, 3, 1, 0],
    barres: [],
    category: 'open'
  },
  {
    name: 'Dm',
    root: 'D',
    quality: 'minor',
    frets: [null, null, 0, 2, 3, 1],
    fingers: [null, null, 0, 2, 3, 1],
    barres: [],
    category: 'open'
  },
  {
    name: 'Em',
    root: 'E',
    quality: 'minor',
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
    barres: [],
    category: 'open'
  },

  // Open 7th Chords
  {
    name: 'A7',
    root: 'A',
    quality: '7',
    frets: [null, 0, 2, 0, 2, 0],
    fingers: [null, 0, 2, 0, 3, 0],
    barres: [],
    category: 'open'
  },
  {
    name: 'B7',
    root: 'B',
    quality: '7',
    frets: [null, 2, 1, 2, 0, 2],
    fingers: [null, 2, 1, 3, 0, 4],
    barres: [],
    category: 'open'
  },
  {
    name: 'C7',
    root: 'C',
    quality: '7',
    frets: [null, 3, 2, 3, 1, 0],
    fingers: [null, 3, 2, 4, 1, 0],
    barres: [],
    category: 'open'
  },
  {
    name: 'D7',
    root: 'D',
    quality: '7',
    frets: [null, null, 0, 2, 1, 2],
    fingers: [null, null, 0, 2, 1, 3],
    barres: [],
    category: 'open'
  },
  {
    name: 'E7',
    root: 'E',
    quality: '7',
    frets: [0, 2, 0, 1, 0, 0],
    fingers: [0, 2, 0, 1, 0, 0],
    barres: [],
    category: 'open'
  },
  {
    name: 'G7',
    root: 'G',
    quality: '7',
    frets: [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, 0, 0, 0, 1],
    barres: [],
    category: 'open'
  },

  // Open Maj7 Chords
  {
    name: 'Cmaj7',
    root: 'C',
    quality: 'maj7',
    frets: [null, 3, 2, 0, 0, 0],
    fingers: [null, 3, 2, 0, 0, 0],
    barres: [],
    category: 'open'
  },
  {
    name: 'Dmaj7',
    root: 'D',
    quality: 'maj7',
    frets: [null, null, 0, 2, 2, 2],
    fingers: [null, null, 0, 1, 2, 3],
    barres: [],
    category: 'open'
  },
  {
    name: 'Emaj7',
    root: 'E',
    quality: 'maj7',
    frets: [0, 2, 1, 1, 0, 0],
    fingers: [0, 3, 1, 2, 0, 0],
    barres: [],
    category: 'open'
  },
  {
    name: 'Gmaj7',
    root: 'G',
    quality: 'maj7',
    frets: [3, 2, 0, 0, 0, 2],
    fingers: [2, 1, 0, 0, 0, 3],
    barres: [],
    category: 'open'
  },
  {
    name: 'Amaj7',
    root: 'A',
    quality: 'maj7',
    frets: [null, 0, 2, 1, 2, 0],
    fingers: [null, 0, 2, 1, 3, 0],
    barres: [],
    category: 'open'
  },

  // Open Minor 7 Chords
  {
    name: 'Am7',
    root: 'A',
    quality: 'm7',
    frets: [null, 0, 2, 0, 1, 0],
    fingers: [null, 0, 2, 0, 1, 0],
    barres: [],
    category: 'open'
  },
  {
    name: 'Dm7',
    root: 'D',
    quality: 'm7',
    frets: [null, null, 0, 2, 1, 1],
    fingers: [null, null, 0, 2, 1, 1],
    barres: [],
    category: 'open'
  },
  {
    name: 'Em7',
    root: 'E',
    quality: 'm7',
    frets: [0, 2, 0, 0, 0, 0],
    fingers: [0, 2, 0, 0, 0, 0],
    barres: [],
    category: 'open'
  },

  // Open Sus Chords
  {
    name: 'Asus2',
    root: 'A',
    quality: 'sus2',
    frets: [null, 0, 2, 2, 0, 0],
    fingers: [null, 0, 1, 2, 0, 0],
    barres: [],
    category: 'open'
  },
  {
    name: 'Asus4',
    root: 'A',
    quality: 'sus4',
    frets: [null, 0, 2, 2, 3, 0],
    fingers: [null, 0, 1, 2, 3, 0],
    barres: [],
    category: 'open'
  },
  {
    name: 'Dsus2',
    root: 'D',
    quality: 'sus2',
    frets: [null, null, 0, 2, 3, 0],
    fingers: [null, null, 0, 1, 3, 0],
    barres: [],
    category: 'open'
  },
  {
    name: 'Dsus4',
    root: 'D',
    quality: 'sus4',
    frets: [null, null, 0, 2, 3, 3],
    fingers: [null, null, 0, 1, 2, 3],
    barres: [],
    category: 'open'
  },
  {
    name: 'Esus4',
    root: 'E',
    quality: 'sus4',
    frets: [0, 2, 2, 2, 0, 0],
    fingers: [0, 2, 3, 4, 0, 0],
    barres: [],
    category: 'open'
  },

  // Barre Major (E shape)
  {
    name: 'F',
    root: 'F',
    quality: 'major',
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    barres: [{ fret: 1, fromString: 0, toString: 5 }],
    category: 'barre'
  },
  {
    name: 'F#/Gb',
    root: 'F#',
    quality: 'major',
    frets: [2, 4, 4, 3, 2, 2],
    fingers: [1, 3, 4, 2, 1, 1],
    barres: [{ fret: 2, fromString: 0, toString: 5 }],
    category: 'barre'
  },
  {
    name: 'Ab',
    root: 'G#',
    quality: 'major',
    frets: [4, 6, 6, 5, 4, 4],
    fingers: [1, 3, 4, 2, 1, 1],
    barres: [{ fret: 4, fromString: 0, toString: 5 }],
    category: 'barre'
  },
  {
    name: 'Bb',
    root: 'A#',
    quality: 'major',
    frets: [6, 8, 8, 7, 6, 6],
    fingers: [1, 3, 4, 2, 1, 1],
    barres: [{ fret: 6, fromString: 0, toString: 5 }],
    category: 'barre'
  },
  {
    name: 'B',
    root: 'B',
    quality: 'major',
    frets: [7, 9, 9, 8, 7, 7],
    fingers: [1, 3, 4, 2, 1, 1],
    barres: [{ fret: 7, fromString: 0, toString: 5 }],
    category: 'barre'
  },

  // Barre Major (A shape)
  {
    name: 'Bb (A shape)',
    root: 'A#',
    quality: 'major',
    frets: [null, 1, 3, 3, 3, 1],
    fingers: [null, 1, 2, 3, 4, 1],
    barres: [{ fret: 1, fromString: 1, toString: 5 }],
    category: 'barre'
  },
  {
    name: 'C (A shape)',
    root: 'C',
    quality: 'major',
    frets: [null, 3, 5, 5, 5, 3],
    fingers: [null, 1, 2, 3, 4, 1],
    barres: [{ fret: 3, fromString: 1, toString: 5 }],
    category: 'barre'
  },
  {
    name: 'D (A shape)',
    root: 'D',
    quality: 'major',
    frets: [null, 5, 7, 7, 7, 5],
    fingers: [null, 1, 2, 3, 4, 1],
    barres: [{ fret: 5, fromString: 1, toString: 5 }],
    category: 'barre'
  },

  // Barre Minor (E shape)
  {
    name: 'Fm',
    root: 'F',
    quality: 'minor',
    frets: [1, 3, 3, 1, 1, 1],
    fingers: [1, 3, 4, 1, 1, 1],
    barres: [{ fret: 1, fromString: 0, toString: 5 }],
    category: 'barre'
  },
  {
    name: 'F#m',
    root: 'F#',
    quality: 'minor',
    frets: [2, 4, 4, 2, 2, 2],
    fingers: [1, 3, 4, 1, 1, 1],
    barres: [{ fret: 2, fromString: 0, toString: 5 }],
    category: 'barre'
  },
  {
    name: 'Gm',
    root: 'G',
    quality: 'minor',
    frets: [3, 5, 5, 3, 3, 3],
    fingers: [1, 3, 4, 1, 1, 1],
    barres: [{ fret: 3, fromString: 0, toString: 5 }],
    category: 'barre'
  },
  {
    name: 'G#m',
    root: 'G#',
    quality: 'minor',
    frets: [4, 6, 6, 4, 4, 4],
    fingers: [1, 3, 4, 1, 1, 1],
    barres: [{ fret: 4, fromString: 0, toString: 5 }],
    category: 'barre'
  },
  {
    name: 'Bm',
    root: 'B',
    quality: 'minor',
    frets: [7, 9, 9, 7, 7, 7],
    fingers: [1, 3, 4, 1, 1, 1],
    barres: [{ fret: 7, fromString: 0, toString: 5 }],
    category: 'barre'
  },
  {
    name: 'C#m',
    root: 'C#',
    quality: 'minor',
    frets: [null, 4, 6, 6, 5, 4],
    fingers: [null, 1, 3, 4, 2, 1],
    barres: [{ fret: 4, fromString: 1, toString: 5 }],
    category: 'barre'
  },

  // Power Chords
  {
    name: 'E5',
    root: 'E',
    quality: '5',
    frets: [0, 2, 2, null, null, null],
    fingers: [0, 1, 2, null, null, null],
    barres: [],
    category: 'open'
  },
  {
    name: 'A5',
    root: 'A',
    quality: '5',
    frets: [null, 0, 2, 2, null, null],
    fingers: [null, 0, 1, 2, null, null],
    barres: [],
    category: 'open'
  },
  {
    name: 'F5',
    root: 'F',
    quality: '5',
    frets: [1, 3, 3, null, null, null],
    fingers: [1, 3, 4, null, null, null],
    barres: [],
    category: 'barre'
  },
  {
    name: 'G5',
    root: 'G',
    quality: '5',
    frets: [3, 5, 5, null, null, null],
    fingers: [1, 3, 4, null, null, null],
    barres: [],
    category: 'barre'
  },

  // Diminished
  {
    name: 'Bdim',
    root: 'B',
    quality: 'dim',
    frets: [null, 2, 3, 4, 3, null],
    fingers: [null, 1, 2, 4, 3, null],
    barres: [],
    category: 'open'
  },

  // Augmented
  {
    name: 'Caug',
    root: 'C',
    quality: 'aug',
    frets: [null, 3, 2, 1, 1, 0],
    fingers: [null, 3, 2, 1, 1, 0],
    barres: [],
    category: 'open'
  },
  {
    name: 'Eaug',
    root: 'E',
    quality: 'aug',
    frets: [0, 3, 2, 1, 1, 0],
    fingers: [0, 4, 3, 2, 1, 0],
    barres: [],
    category: 'open'
  }
]
