import type { GenreId } from './learn-types'

export interface RhythmPattern {
  name: string
  description: string
  difficulty: 1 | 2 | 3
  beatsPerMeasure: number
  subdivisions: number
  hits: boolean[]
  genreTags?: GenreId[]
}

export const RHYTHM_PATTERNS: RhythmPattern[] = [
  {
    name: 'Whole Notes',
    description: 'One strum per measure',
    difficulty: 1,
    beatsPerMeasure: 4,
    subdivisions: 1,
    hits: [true, false, false, false],
    genreTags: ['general']
  },
  {
    name: 'Quarter Notes',
    description: 'Steady downbeats',
    difficulty: 1,
    beatsPerMeasure: 4,
    subdivisions: 1,
    hits: [true, true, true, true],
    genreTags: ['general', 'rock', 'pop', 'country']
  },
  {
    name: 'Half Notes',
    description: 'Beats 1 and 3',
    difficulty: 1,
    beatsPerMeasure: 4,
    subdivisions: 1,
    hits: [true, false, true, false],
    genreTags: ['general', 'country']
  },
  {
    name: 'Eighth Notes',
    description: 'Down-up strumming',
    difficulty: 1,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [true, true, true, true, true, true, true, true],
    genreTags: ['general', 'rock', 'pop', 'country']
  },
  {
    name: 'Eighth Rest Start',
    description: 'Rest on downbeats, play upbeats',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [false, true, false, true, false, true, false, true],
    genreTags: ['funk']
  },
  {
    name: 'Basic Syncopation',
    description: 'Accent the and of 2 and 4',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [true, false, true, true, true, false, true, true],
    genreTags: ['funk', 'pop']
  },
  {
    name: 'Rock Beat',
    description: 'Classic 1-and-3-and pattern',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [true, false, false, true, true, false, false, true],
    genreTags: ['rock']
  },
  {
    name: 'Folk Strum',
    description: 'Down down-up up-down-up',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [true, false, true, true, false, true, true, false],
    genreTags: ['pop', 'country']
  },
  {
    name: 'Sixteenth Notes',
    description: 'Fast even strumming',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 4,
    hits: Array(16).fill(true),
    genreTags: ['rock', 'funk']
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
    ],
    genreTags: ['funk']
  },
  {
    name: 'Waltz',
    description: 'Three-quarter time: strong-weak-weak',
    difficulty: 1,
    beatsPerMeasure: 3,
    subdivisions: 1,
    hits: [true, true, true],
    genreTags: ['country']
  },
  {
    name: 'Waltz Eighth',
    description: '3/4 with eighth note subdivision',
    difficulty: 2,
    beatsPerMeasure: 3,
    subdivisions: 2,
    hits: [true, false, true, false, true, false],
    genreTags: ['country']
  },
  {
    name: 'Reggae Skank',
    description: 'Play on the and of each beat',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [false, true, false, true, false, true, false, true],
    genreTags: ['general']
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
    ],
    genreTags: ['rock', 'blues']
  },
  {
    name: 'Shuffle',
    description: 'Swing feel with triplet subdivision',
    difficulty: 3,
    beatsPerMeasure: 4,
    subdivisions: 3,
    hits: [true, false, true, true, false, true, true, false, true, true, false, true],
    genreTags: ['blues']
  },
  {
    name: 'Pop Pulse',
    description: 'Straight-ahead pop groove with a lifted upbeat push.',
    difficulty: 1,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [true, false, true, true, true, false, true, true],
    genreTags: ['pop']
  },
  {
    name: 'Muted Funk Chops',
    description: 'Clipped sixteenth-note stabs that stay tight around the pocket.',
    difficulty: 3,
    beatsPerMeasure: 4,
    subdivisions: 4,
    hits: [
      false, true, false, true, true, false, false, true, false, true, false, true, true, false,
      false, true
    ],
    genreTags: ['funk']
  },
  {
    name: 'Country Train Beat',
    description: 'Snappy boom-chick motion that keeps the right hand driving.',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [true, false, true, true, true, false, true, true],
    genreTags: ['country']
  },
  {
    name: 'Alternating Bass',
    description: 'Fingerpicked pulse that alternates bass notes with upper-string plucks.',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 2,
    hits: [true, true, true, true, true, true, true, true],
    genreTags: ['fingerpicking']
  },
  {
    name: 'Fingerpicked Arpeggio',
    description: 'Broken-chord roll pattern for clean fingerpicking timing.',
    difficulty: 2,
    beatsPerMeasure: 4,
    subdivisions: 4,
    hits: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    genreTags: ['fingerpicking']
  }
]
