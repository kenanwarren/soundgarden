export interface RhythmPattern {
  name: string
  description: string
  difficulty: 1 | 2 | 3
  beatsPerMeasure: number
  subdivisions: number
  hits: boolean[]
}

export const RHYTHM_PATTERNS: RhythmPattern[] = [
  {
    name: 'Whole Notes',
    description: 'One strum per measure',
    difficulty: 1,
    beatsPerMeasure: 4,
    subdivisions: 1,
    hits: [true, false, false, false]
  },
  {
    name: 'Quarter Notes',
    description: 'Steady downbeats',
    difficulty: 1,
    beatsPerMeasure: 4,
    subdivisions: 1,
    hits: [true, true, true, true]
  },
  {
    name: 'Half Notes',
    description: 'Beats 1 and 3',
    difficulty: 1,
    beatsPerMeasure: 4,
    subdivisions: 1,
    hits: [true, false, true, false]
  },
  {
    name: 'Eighth Notes',
    description: 'Down-up strumming',
    difficulty: 1,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [true, true, true, true, true, true, true, true]
  },
  {
    name: 'Eighth Rest Start',
    description: 'Rest on downbeats, play upbeats',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [false, true, false, true, false, true, false, true]
  },
  {
    name: 'Basic Syncopation',
    description: 'Accent the and of 2 and 4',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [true, false, true, true, true, false, true, true]
  },
  {
    name: 'Rock Beat',
    description: 'Classic 1-and-3-and pattern',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [true, false, false, true, true, false, false, true]
  },
  {
    name: 'Folk Strum',
    description: 'Down down-up up-down-up',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [true, false, true, true, false, true, true, false]
  },
  {
    name: 'Sixteenth Notes',
    description: 'Fast even strumming',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 4,
    hits: Array(16).fill(true)
  },
  {
    name: 'Sixteenth Funk',
    description: 'Classic funk pattern with ghost notes',
    difficulty: 3,
    beatsPerMeasure: 4,
    subdivisions: 4,
    hits: [
      true, false, true, false, false, true, false, true, true, false, true, false, false, true,
      false, true
    ]
  },
  {
    name: 'Waltz',
    description: 'Three-quarter time: strong-weak-weak',
    difficulty: 1,
    beatsPerMeasure: 3,
    subdivisions: 1,
    hits: [true, true, true]
  },
  {
    name: 'Waltz Eighth',
    description: '3/4 with eighth note subdivision',
    difficulty: 2,
    beatsPerMeasure: 3,
    subdivisions: 2,
    hits: [true, false, true, false, true, false]
  },
  {
    name: 'Reggae Skank',
    description: 'Play on the and of each beat',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [false, true, false, true, false, true, false, true]
  },
  {
    name: 'Bo Diddley',
    description: 'Classic 3+2 clave-style rhythm',
    difficulty: 3,
    beatsPerMeasure: 4,
    subdivisions: 4,
    hits: [
      true, false, false, true, false, false, true, false, false, false, true, false, true, false,
      false, false
    ]
  },
  {
    name: 'Shuffle',
    description: 'Swing feel with triplet subdivision',
    difficulty: 3,
    beatsPerMeasure: 4,
    subdivisions: 3,
    hits: [true, false, true, true, false, true, true, false, true, true, false, true]
  }
]
