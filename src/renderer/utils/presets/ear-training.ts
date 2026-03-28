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

export const EAR_TRAINING_PRESETS: EarTrainingPreset[] = [
  {
    id: 'blues-call-response',
    name: 'Blues Call & Response',
    description: 'Focus on the bluesy interval color that makes a phrase answer back.',
    promptLabel: 'Listen for blue-third and dominant-color movement.',
    mode: 'interval',
    genreTags: ['blues'],
    allowedSemitones: [3, 5, 7, 10]
  },
  {
    id: 'rock-riff-intervals',
    name: 'Rock Riff Intervals',
    description: 'Work with the short interval leaps common in rock riffs.',
    promptLabel: 'Hear the second, fourth, and fifth that drive rock hooks.',
    mode: 'interval',
    genreTags: ['rock'],
    allowedSemitones: [2, 5, 7]
  },
  {
    id: 'pop-hook-recall',
    name: 'Pop Hook Recall',
    description: 'Stay on singable note targets that feel like chorus anchor tones.',
    promptLabel: 'Match the kind of note that would center a pop hook.',
    mode: 'note',
    genreTags: ['pop'],
    referenceNotes: ['C', 'D', 'E', 'G', 'A']
  },
  {
    id: 'funk-pocket-intervals',
    name: 'Funk Pocket Intervals',
    description: 'Focus on shorter interval jumps and dominant color tones.',
    promptLabel: 'Hear the compact interval moves that lock into the pocket.',
    mode: 'interval',
    genreTags: ['funk'],
    allowedSemitones: [2, 4, 7, 10]
  },
  {
    id: 'country-resolve',
    name: 'Country Resolve',
    description: 'Work with interval moves that resolve brightly inside open-chord harmony.',
    promptLabel: 'Listen for clean, resolving movement that sits inside country phrases.',
    mode: 'interval',
    genreTags: ['country'],
    allowedSemitones: [2, 5, 7]
  },
  {
    id: 'fingerpicked-open-strings',
    name: 'Fingerpicked Open Strings',
    description: 'Practice note recall around open-string-friendly targets.',
    promptLabel: 'Match open-feeling note centers used in fingerpicked patterns.',
    mode: 'note',
    genreTags: ['fingerpicking'],
    referenceNotes: ['C', 'D', 'E', 'G', 'A']
  }
]
