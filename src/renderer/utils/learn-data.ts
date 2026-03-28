import { CHORD_VOICINGS } from './chord-voicings'
import { RHYTHM_PATTERNS } from './rhythm-patterns'
import { SCALES } from './scale-data'
import type {
  GenreDefinition,
  GenreId,
  LearnModuleId,
  LearnProgressEntry,
  LearnSkillId,
  LessonStep,
  PracticePath,
  SessionSummary
} from './learn-types'
import type { SystemStatus } from './system-status'
import type { ScaleSequenceType } from './learn-drills'

export interface ChordChangePreset {
  id: string
  name: string
  description: string
  chordNames: string[]
  genreTags: GenreId[]
  toneSuggestions?: string[]
}

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

export const MODULE_ROUTES: Record<LearnModuleId, string> = {
  setup: '/',
  'scale-explorer': '/learn/scales',
  'chord-library': '/learn/chords',
  'rhythm-trainer': '/learn/rhythm',
  'ear-training': '/learn/ear-training',
  'chord-changes': '/learn/chord-changes',
  'scale-sequences': '/learn/scale-sequences'
}

export const LEARN_FEATURES: Array<{
  to: string
  module: LearnModuleId
  title: string
  description: string
}> = [
  {
    to: '/learn/scales',
    module: 'scale-explorer',
    title: 'Scale Explorer',
    description: 'Look up scale maps and switch into live note coverage when needed.'
  },
  {
    to: '/learn/chords',
    module: 'chord-library',
    title: 'Chord Library',
    description: 'Look up voicings, fingerings, and clean chord matches.'
  },
  {
    to: '/learn/rhythm',
    module: 'rhythm-trainer',
    title: 'Rhythm Patterns',
    description: 'Browse pattern shapes first, then measure timing and tendency.'
  },
  {
    to: '/learn/ear-training',
    module: 'ear-training',
    title: 'Ear Training',
    description: 'Train note and interval recognition with replayable prompts.'
  },
  {
    to: '/learn/chord-changes',
    module: 'chord-changes',
    title: 'Chord Changes Trainer',
    description: 'Switch target chords against the clock and count clean changes.'
  },
  {
    to: '/learn/scale-sequences',
    module: 'scale-sequences',
    title: 'Scale Sequence Trainer',
    description: 'Play scales in order with ascending, descending, and thirds patterns.'
  }
]

export const LEARN_SKILLS: Array<{
  id: LearnSkillId
  title: string
  description: string
}> = [
  { id: 'chords', title: 'Chords', description: 'Voicings, changes, and harmonic control.' },
  { id: 'scales', title: 'Scales', description: 'Scale maps, boxes, and melodic movement.' },
  { id: 'rhythm', title: 'Rhythm', description: 'Pattern fluency and subdivision control.' },
  { id: 'ear', title: 'Ear', description: 'Recall pitches and interval movement by ear.' },
  { id: 'timing', title: 'Timing', description: 'Land attacks on time and control drift.' },
  { id: 'groove', title: 'Groove', description: 'Style-specific feel and pocket awareness.' },
  { id: 'technique', title: 'Technique', description: 'Picking-hand and fretting-hand mechanics.' },
  {
    id: 'fingerstyle',
    title: 'Fingerstyle',
    description: 'Alternating bass, rolls, and arpeggiated motion.'
  }
]

export const GENRE_DEFINITIONS: GenreDefinition[] = [
  {
    id: 'general',
    title: 'General',
    description: 'Skill-first paths that build broad guitar fundamentals.',
    shortSummary: 'Foundational practice outside a single genre focus.',
    focusSkills: ['chords', 'scales', 'rhythm', 'ear'],
    recommendedTools: ['scale-explorer', 'chord-library', 'rhythm-trainer', 'ear-training'],
    toneSuggestions: ['Neutral clean tone', 'Simple metronome-backed practice', 'Minimal effects'],
    hidden: true
  },
  {
    id: 'blues',
    title: 'Blues',
    description:
      'Dominant chords, shuffle feel, call-and-response phrases, and blues box movement.',
    shortSummary: 'Shuffles, 7th chords, and blues-scale phrasing.',
    starterPathId: 'blues-foundations',
    focusSkills: ['chords', 'scales', 'rhythm', 'ear', 'groove'],
    recommendedTools: ['rhythm-trainer', 'chord-changes', 'scale-sequences', 'ear-training'],
    toneSuggestions: [
      'Edge-of-breakup amp with spring-style reverb',
      'Neck pickup with light compression',
      'Short slapback delay for leads'
    ]
  },
  {
    id: 'rock',
    title: 'Rock',
    description: 'Power chords, straight subdivisions, and pentatonic lines with more drive.',
    shortSummary: 'Power-chord control and riff-ready timing.',
    starterPathId: 'rock-riff-builder',
    focusSkills: ['chords', 'rhythm', 'scales', 'timing', 'technique'],
    recommendedTools: ['chord-library', 'chord-changes', 'rhythm-trainer', 'scale-sequences'],
    toneSuggestions: [
      'Crunch drive into cabinet sim',
      'Tighter noise gate before gain',
      'Small-room reverb with controlled sustain'
    ]
  },
  {
    id: 'pop',
    title: 'Pop',
    description: 'Hook-friendly chord loops, even pulse, and clear major/minor movement.',
    shortSummary: 'Four-chord fluency and tight, singable groove.',
    starterPathId: 'pop-song-core',
    focusSkills: ['chords', 'rhythm', 'timing', 'ear'],
    recommendedTools: ['chord-changes', 'rhythm-trainer', 'ear-training', 'scale-sequences'],
    toneSuggestions: [
      'Clean compressor with subtle chorus',
      'Bright stereo-style delay kept low in the mix',
      'Controlled clean tone with soft ambience'
    ]
  },
  {
    id: 'funk',
    title: 'Funk',
    description: 'Sixteenth-note pocket, clipped chord stabs, and Mixolydian groove vocabulary.',
    shortSummary: 'Syncopation, pocket, and tight dominant chord work.',
    starterPathId: 'funk-pocket-builder',
    focusSkills: ['rhythm', 'groove', 'chords', 'timing'],
    recommendedTools: ['rhythm-trainer', 'chord-changes', 'chord-library', 'scale-sequences'],
    toneSuggestions: [
      'Very clean compressor-forward tone',
      'Auto-wah or envelope-style filter used sparingly',
      'Fast transient response with low reverb'
    ]
  },
  {
    id: 'country',
    title: 'Country',
    description: 'Open-chord drive, train-beat rhythm, and bright pentatonic or Mixolydian motion.',
    shortSummary: 'Boom-chick feel, open chords, and bright melodic movement.',
    starterPathId: 'country-road-groove',
    focusSkills: ['chords', 'rhythm', 'timing', 'scales'],
    recommendedTools: ['rhythm-trainer', 'chord-changes', 'scale-sequences', 'chord-library'],
    toneSuggestions: [
      'Bright clean tone with slapback delay',
      'Bridge pickup with restrained compression',
      'Dry room ambience and quick attack'
    ]
  },
  {
    id: 'fingerpicking',
    title: 'Fingerpicking',
    description:
      'Alternating bass, broken-chord rolls, and arpeggiated movement without hand-tracking.',
    shortSummary: 'Pattern-led fingerstyle timing and open-chord control.',
    starterPathId: 'fingerpicking-foundations',
    focusSkills: ['fingerstyle', 'rhythm', 'technique', 'chords'],
    recommendedTools: ['rhythm-trainer', 'chord-changes', 'scale-sequences', 'ear-training'],
    toneSuggestions: [
      'Dry clean tone with a little room reverb',
      'Gentle compression for even plucks',
      'Lower-gain, lower-noise signal path'
    ]
  }
]

export const CHORD_CHANGE_PRESETS: ChordChangePreset[] = [
  {
    id: 'open-two',
    name: 'Open Two-Chord Loop',
    description: 'Lock in a clean C to G switch every measure.',
    chordNames: ['C', 'G'],
    genreTags: ['general', 'pop', 'country'],
    toneSuggestions: ['Straight clean tone', 'Moderate tempo with light ambience']
  },
  {
    id: 'pop-four',
    name: 'Pop Four-Chord Loop',
    description: 'Cycle through C, G, Am, and F with steady changes.',
    chordNames: ['C', 'G', 'Am', 'F'],
    genreTags: ['pop'],
    toneSuggestions: ['Compressed clean tone', 'Chorus or stereo delay kept subtle']
  },
  {
    id: 'dominant-ladder',
    name: 'Dominant Ladder',
    description: 'Move across A7, D7, and E7 with confident transitions.',
    chordNames: ['A7', 'D7', 'E7'],
    genreTags: ['general', 'blues', 'funk'],
    toneSuggestions: ['Edge-of-breakup tone', 'Short spring-style ambience']
  },
  {
    id: 'blues-turnaround',
    name: 'Blues Turnaround',
    description: 'Cycle through E7, A7, B7, and back to A7 with a shuffle pulse.',
    chordNames: ['E7', 'A7', 'B7', 'A7'],
    genreTags: ['blues'],
    toneSuggestions: ['Warm breakup with spring reverb', 'Neck pickup lead tone']
  },
  {
    id: 'rock-power-stack',
    name: 'Rock Power Stack',
    description: 'Move between E5, G5, A5, and back to G5 for riff-ready changes.',
    chordNames: ['E5', 'G5', 'A5', 'G5'],
    genreTags: ['rock'],
    toneSuggestions: ['Crunch drive with cabinet sim', 'Tighter gate before distortion']
  },
  {
    id: 'funk-vamp',
    name: 'Funk Pocket Vamp',
    description: 'Trade clipped dominant and minor-7 shapes without losing the pocket.',
    chordNames: ['Am7', 'D7', 'E7', 'A7'],
    genreTags: ['funk'],
    toneSuggestions: ['Compressor-first clean tone', 'Optional auto-wah kept low']
  },
  {
    id: 'country-open-road',
    name: 'Country Open Road',
    description: 'Work through G, D, Em, and C with bright open-chord momentum.',
    chordNames: ['G', 'D', 'Em', 'C'],
    genreTags: ['country'],
    toneSuggestions: ['Bright clean tone', 'Short slapback delay']
  },
  {
    id: 'fingerpicked-open-roll',
    name: 'Fingerpicked Open Roll',
    description: 'Cycle C, G, Am, and F while keeping the picking hand even.',
    chordNames: ['C', 'G', 'Am', 'F'],
    genreTags: ['fingerpicking'],
    toneSuggestions: ['Dry clean tone', 'Light compression for even plucks']
  }
]

export const SCALE_SEQUENCE_PRESETS: ScaleSequencePreset[] = [
  {
    id: 'blues-box-run',
    name: 'Blues Box Run',
    description: 'Move through the A blues box without skipping the blue note.',
    root: 'A',
    scaleName: 'Blues',
    sequenceType: 'ascending',
    loops: 2,
    genreTags: ['blues']
  },
  {
    id: 'rock-pentatonic-drive',
    name: 'Rock Pentatonic Drive',
    description: 'Run E minor pentatonic in an assertive, even sequence.',
    root: 'E',
    scaleName: 'Minor Pentatonic',
    sequenceType: 'ascending',
    loops: 2,
    genreTags: ['rock']
  },
  {
    id: 'pop-major-hooks',
    name: 'Pop Major Hooks',
    description: 'Trace major-scale motion that feels singable and direct.',
    root: 'C',
    scaleName: 'Major',
    sequenceType: 'ascending',
    loops: 2,
    genreTags: ['pop']
  },
  {
    id: 'funk-mixolydian-pocket',
    name: 'Funk Mixolydian Pocket',
    description: 'Move through A Mixolydian in thirds to hear groove-friendly color tones.',
    root: 'A',
    scaleName: 'Mixolydian',
    sequenceType: 'thirds',
    loops: 2,
    genreTags: ['funk']
  },
  {
    id: 'country-major-pentatonic-roll',
    name: 'Country Major Pentatonic Roll',
    description: 'Descend through G major pentatonic with bright, skipping motion.',
    root: 'G',
    scaleName: 'Major Pentatonic',
    sequenceType: 'descending',
    loops: 2,
    genreTags: ['country']
  },
  {
    id: 'fingerpicked-arpeggio-map',
    name: 'Fingerpicked Arpeggio Map',
    description: 'Use a C major sequence as a picking-hand timing map.',
    root: 'C',
    scaleName: 'Major',
    sequenceType: 'descending',
    loops: 2,
    genreTags: ['fingerpicking']
  }
]

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

export const PRACTICE_PATHS: PracticePath[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    description: 'Get connected, lock in a core chord, then add rhythm, ear, and scale basics.',
    genre: 'general',
    difficulty: 'Beginner',
    focusSkills: ['chords', 'rhythm', 'ear', 'scales'],
    recommendedTools: ['chord-library', 'rhythm-trainer', 'ear-training', 'scale-explorer'],
    toneSuggestions: ['Neutral clean tone', 'Metronome-forward setup', 'Low-ambience monitoring'],
    starterPresetIds: ['rhythm:quarter-notes', 'rhythm:eighth-notes'],
    steps: [
      {
        id: 'foundations-setup',
        title: 'Connect Your Input',
        description: 'Reach a healthy live-input state before starting guided practice.',
        module: 'setup',
        route: '/',
        audioRequired: false,
        prefill: { module: 'setup' },
        completionRule: { type: 'setup-ready' }
      },
      {
        id: 'foundations-open-c',
        title: 'Open Major Focus',
        description: 'Practice the open C voicing until you can trigger clean matches reliably.',
        module: 'chord-library',
        route: '/learn/chords',
        audioRequired: true,
        prefill: {
          module: 'chord-library',
          filterCategory: 'open',
          chordName: 'C',
          filterRoot: 'C'
        },
        completionRule: { type: 'chord-match-count', minMatches: 3, targetChord: 'C' }
      },
      {
        id: 'foundations-quarter-notes',
        title: 'Quarter-Note Pulse',
        description: 'Build dependable downbeats before adding denser rhythms.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: {
          module: 'rhythm-trainer',
          patternName: 'Quarter Notes',
          bpm: 80,
          sensitivity: 'mid'
        },
        completionRule: { type: 'rhythm-accuracy', minAccuracy: 75, patternName: 'Quarter Notes' }
      },
      {
        id: 'foundations-ear-note',
        title: 'Single-Note Echo',
        description: 'Hear one target pitch and play it back cleanly.',
        module: 'ear-training',
        route: '/learn/ear-training',
        audioRequired: true,
        prefill: { module: 'ear-training', mode: 'note' },
        completionRule: { type: 'ear-accuracy', mode: 'note', minAccuracy: 70, minTotal: 4 }
      },
      {
        id: 'foundations-minor-pentatonic',
        title: 'Minor Pentatonic Map',
        description: 'Play through the A minor pentatonic note set with live note tracking.',
        module: 'scale-explorer',
        route: '/learn/scales',
        audioRequired: true,
        prefill: { module: 'scale-explorer', root: 'A', scaleName: 'Minor Pentatonic' },
        completionRule: { type: 'scale-notes-hit', minNotes: 5 }
      }
    ]
  },
  {
    id: 'timing-builder',
    title: 'Timing Builder',
    description: 'Progress from straight time into syncopation and shuffle feel.',
    genre: 'general',
    difficulty: 'Developing',
    focusSkills: ['rhythm', 'timing', 'groove'],
    recommendedTools: ['rhythm-trainer'],
    toneSuggestions: ['Dry practice tone', 'Clear attack with low ambience'],
    starterPresetIds: ['rhythm:quarter-notes', 'rhythm:shuffle'],
    steps: [
      {
        id: 'timing-quarter-notes',
        title: 'Quarter-Note Check-In',
        description: 'Start with a simple pulse and tighten the hit window.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: {
          module: 'rhythm-trainer',
          patternName: 'Quarter Notes',
          bpm: 90,
          sensitivity: 'mid'
        },
        completionRule: { type: 'rhythm-accuracy', minAccuracy: 80, patternName: 'Quarter Notes' }
      },
      {
        id: 'timing-eighth-notes',
        title: 'Eighth-Note Engine',
        description: 'Hold even subdivisions without drifting ahead or behind.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: {
          module: 'rhythm-trainer',
          patternName: 'Eighth Notes',
          bpm: 92,
          sensitivity: 'mid'
        },
        completionRule: { type: 'rhythm-accuracy', minAccuracy: 76, patternName: 'Eighth Notes' }
      },
      {
        id: 'timing-syncopation',
        title: 'Basic Syncopation',
        description: 'Land the off-beat pushes without losing the pulse.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: {
          module: 'rhythm-trainer',
          patternName: 'Basic Syncopation',
          bpm: 90,
          sensitivity: 'mid'
        },
        completionRule: {
          type: 'rhythm-accuracy',
          minAccuracy: 70,
          patternName: 'Basic Syncopation'
        }
      },
      {
        id: 'timing-shuffle',
        title: 'Shuffle Feel',
        description: 'Shift into triplet feel and keep the swing consistent.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: {
          module: 'rhythm-trainer',
          patternName: 'Shuffle',
          bpm: 84,
          sensitivity: 'high'
        },
        completionRule: { type: 'rhythm-accuracy', minAccuracy: 66, patternName: 'Shuffle' }
      }
    ]
  },
  {
    id: 'chord-fluency',
    title: 'Chord Fluency',
    description: 'Move from open shapes into sevenths, barres, and timed chord changes.',
    genre: 'general',
    difficulty: 'Intermediate',
    focusSkills: ['chords', 'technique', 'timing'],
    recommendedTools: ['chord-library', 'chord-changes'],
    toneSuggestions: ['Clean or edge-of-breakup tone', 'Low noise floor for clearer detection'],
    starterPresetIds: ['chord-changes:pop-four'],
    steps: [
      {
        id: 'chord-fluency-open-major',
        title: 'Open Major Control',
        description: 'Match the open G voicing cleanly and consistently.',
        module: 'chord-library',
        route: '/learn/chords',
        audioRequired: true,
        prefill: {
          module: 'chord-library',
          filterCategory: 'open',
          chordName: 'G',
          filterRoot: 'G'
        },
        completionRule: { type: 'chord-match-count', minMatches: 3, targetChord: 'G' }
      },
      {
        id: 'chord-fluency-open-minor',
        title: 'Open Minor Control',
        description: 'Settle on Am without extra strings or muddy attacks.',
        module: 'chord-library',
        route: '/learn/chords',
        audioRequired: true,
        prefill: {
          module: 'chord-library',
          filterCategory: 'open',
          chordName: 'Am',
          filterRoot: 'A'
        },
        completionRule: { type: 'chord-match-count', minMatches: 3, targetChord: 'Am' }
      },
      {
        id: 'chord-fluency-seventh',
        title: 'Seventh Chord Focus',
        description: 'Hear and hit the dominant A7 shape cleanly.',
        module: 'chord-library',
        route: '/learn/chords',
        audioRequired: true,
        prefill: {
          module: 'chord-library',
          filterCategory: 'open',
          chordName: 'A7',
          filterRoot: 'A'
        },
        completionRule: { type: 'chord-match-count', minMatches: 3, targetChord: 'A7' }
      },
      {
        id: 'chord-fluency-barre',
        title: 'Barre Intro',
        description: 'Stabilise an F barre shape before moving into changes.',
        module: 'chord-library',
        route: '/learn/chords',
        audioRequired: true,
        prefill: {
          module: 'chord-library',
          filterCategory: 'barre',
          chordName: 'F',
          filterRoot: 'F'
        },
        completionRule: { type: 'chord-match-count', minMatches: 2, targetChord: 'F' }
      },
      {
        id: 'chord-fluency-changes',
        title: 'Timed Chord Changes',
        description: 'Switch through a four-chord loop without leaving the target set.',
        module: 'chord-changes',
        route: '/learn/chord-changes',
        audioRequired: true,
        prefill: { module: 'chord-changes', presetId: 'pop-four', bpm: 84 },
        completionRule: { type: 'chord-changes', minSwitches: 4, presetId: 'pop-four' }
      }
    ]
  },
  {
    id: 'blues-foundations',
    title: 'Blues Foundations',
    description: 'Build shuffle feel, dominant changes, blues-box motion, and ear-led response.',
    genre: 'blues',
    difficulty: 'Beginner',
    focusSkills: ['chords', 'rhythm', 'scales', 'ear', 'groove'],
    recommendedTools: ['rhythm-trainer', 'chord-changes', 'scale-sequences', 'ear-training'],
    toneSuggestions: GENRE_DEFINITIONS.find((genre) => genre.id === 'blues')?.toneSuggestions,
    starterPresetIds: [
      'rhythm:shuffle',
      'chord-changes:blues-turnaround',
      'scale-sequences:blues-box-run',
      'ear:blues-call-response'
    ],
    steps: [
      {
        id: 'blues-dominant-focus',
        title: 'Dominant 7 Focus',
        description: 'Settle the A7 voicing before moving through a full blues turnaround.',
        module: 'chord-library',
        route: '/learn/chords',
        audioRequired: true,
        prefill: {
          module: 'chord-library',
          filterCategory: 'open',
          chordName: 'A7',
          filterRoot: 'A'
        },
        completionRule: { type: 'chord-match-count', minMatches: 3, targetChord: 'A7' }
      },
      {
        id: 'blues-shuffle-pocket',
        title: 'Shuffle Pocket',
        description: 'Lock your attacks into a swung triplet feel.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: { module: 'rhythm-trainer', patternName: 'Shuffle', bpm: 76, sensitivity: 'high' },
        completionRule: { type: 'rhythm-accuracy', minAccuracy: 68, patternName: 'Shuffle' }
      },
      {
        id: 'blues-turnaround-changes',
        title: 'Turnaround Changes',
        description: 'Cycle dominant chords without losing the form.',
        module: 'chord-changes',
        route: '/learn/chord-changes',
        audioRequired: true,
        prefill: { module: 'chord-changes', presetId: 'blues-turnaround', bpm: 76 },
        completionRule: { type: 'chord-changes', minSwitches: 4, presetId: 'blues-turnaround' }
      },
      {
        id: 'blues-box-sequence',
        title: 'Blues Box Run',
        description: 'Run the blues scale in order without skipping the blue note.',
        module: 'scale-sequences',
        route: '/learn/scale-sequences',
        audioRequired: true,
        prefill: {
          module: 'scale-sequences',
          presetId: 'blues-box-run',
          root: 'A',
          scaleName: 'Blues',
          sequenceType: 'ascending',
          loops: 2
        },
        completionRule: { type: 'scale-sequence', minLoops: 2, sequenceType: 'ascending' }
      },
      {
        id: 'blues-call-response',
        title: 'Call & Response Ear',
        description: 'Hear the blues color tones before you answer on guitar.',
        module: 'ear-training',
        route: '/learn/ear-training',
        audioRequired: true,
        prefill: { module: 'ear-training', mode: 'interval', presetId: 'blues-call-response' },
        completionRule: { type: 'ear-accuracy', mode: 'interval', minAccuracy: 65, minTotal: 4 }
      }
    ]
  },
  {
    id: 'rock-riff-builder',
    title: 'Rock Riff Builder',
    description: 'Build power-chord confidence, steady eighths, and pentatonic riff movement.',
    genre: 'rock',
    difficulty: 'Developing',
    focusSkills: ['chords', 'rhythm', 'scales', 'timing', 'technique'],
    recommendedTools: ['chord-library', 'chord-changes', 'rhythm-trainer', 'scale-sequences'],
    toneSuggestions: GENRE_DEFINITIONS.find((genre) => genre.id === 'rock')?.toneSuggestions,
    starterPresetIds: [
      'rhythm:rock-beat',
      'chord-changes:rock-power-stack',
      'scale-sequences:rock-pentatonic-drive',
      'ear:rock-riff-intervals'
    ],
    steps: [
      {
        id: 'rock-power-focus',
        title: 'Power Chord Focus',
        description: 'Hit E5 cleanly and keep the low-string attack controlled.',
        module: 'chord-library',
        route: '/learn/chords',
        audioRequired: true,
        prefill: {
          module: 'chord-library',
          filterCategory: 'open',
          chordName: 'E5',
          filterRoot: 'E'
        },
        completionRule: { type: 'chord-match-count', minMatches: 3, targetChord: 'E5' }
      },
      {
        id: 'rock-beat-engine',
        title: 'Rock Beat Engine',
        description: 'Keep steady accents through a classic rock groove.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: {
          module: 'rhythm-trainer',
          patternName: 'Rock Beat',
          bpm: 96,
          sensitivity: 'mid'
        },
        completionRule: { type: 'rhythm-accuracy', minAccuracy: 72, patternName: 'Rock Beat' }
      },
      {
        id: 'rock-power-changes',
        title: 'Power Stack Changes',
        description: 'Move through a small power-chord loop without overshooting the target.',
        module: 'chord-changes',
        route: '/learn/chord-changes',
        audioRequired: true,
        prefill: { module: 'chord-changes', presetId: 'rock-power-stack', bpm: 94 },
        completionRule: { type: 'chord-changes', minSwitches: 4, presetId: 'rock-power-stack' }
      },
      {
        id: 'rock-pentatonic-sequence',
        title: 'Minor Pentatonic Drive',
        description: 'Run the E minor pentatonic box with even timing and attack.',
        module: 'scale-sequences',
        route: '/learn/scale-sequences',
        audioRequired: true,
        prefill: {
          module: 'scale-sequences',
          presetId: 'rock-pentatonic-drive',
          root: 'E',
          scaleName: 'Minor Pentatonic',
          sequenceType: 'ascending',
          loops: 2
        },
        completionRule: { type: 'scale-sequence', minLoops: 2, sequenceType: 'ascending' }
      },
      {
        id: 'rock-riff-ear-step',
        title: 'Riff Interval Ear',
        description: 'Hear the interval jumps that make short riffs land.',
        module: 'ear-training',
        route: '/learn/ear-training',
        audioRequired: true,
        prefill: { module: 'ear-training', mode: 'interval', presetId: 'rock-riff-intervals' },
        completionRule: { type: 'ear-accuracy', mode: 'interval', minAccuracy: 65, minTotal: 4 }
      }
    ]
  },
  {
    id: 'pop-song-core',
    title: 'Pop Song Core',
    description: 'Build a clean chord loop, a locked pulse, and singable melodic movement.',
    genre: 'pop',
    difficulty: 'Beginner',
    focusSkills: ['chords', 'rhythm', 'timing', 'ear'],
    recommendedTools: ['chord-changes', 'rhythm-trainer', 'ear-training', 'scale-sequences'],
    toneSuggestions: GENRE_DEFINITIONS.find((genre) => genre.id === 'pop')?.toneSuggestions,
    starterPresetIds: [
      'rhythm:pop-pulse',
      'chord-changes:pop-four',
      'scale-sequences:pop-major-hooks',
      'ear:pop-hook-recall'
    ],
    steps: [
      {
        id: 'pop-open-focus',
        title: 'Open Chord Center',
        description: 'Center your fretting hand on a clean C chord before entering the full loop.',
        module: 'chord-library',
        route: '/learn/chords',
        audioRequired: true,
        prefill: {
          module: 'chord-library',
          filterCategory: 'open',
          chordName: 'C',
          filterRoot: 'C'
        },
        completionRule: { type: 'chord-match-count', minMatches: 3, targetChord: 'C' }
      },
      {
        id: 'pop-pulse-step',
        title: 'Pop Pulse',
        description: 'Keep the groove even and forward-driving.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: {
          module: 'rhythm-trainer',
          patternName: 'Pop Pulse',
          bpm: 96,
          sensitivity: 'mid'
        },
        completionRule: { type: 'rhythm-accuracy', minAccuracy: 75, patternName: 'Pop Pulse' }
      },
      {
        id: 'pop-four-loop-step',
        title: 'Four-Chord Loop',
        description: 'Move through a familiar pop loop without breaking the pulse.',
        module: 'chord-changes',
        route: '/learn/chord-changes',
        audioRequired: true,
        prefill: { module: 'chord-changes', presetId: 'pop-four', bpm: 92 },
        completionRule: { type: 'chord-changes', minSwitches: 4, presetId: 'pop-four' }
      },
      {
        id: 'pop-major-hooks-step',
        title: 'Major Hook Motion',
        description: 'Trace a clear major line that feels like a chorus hook.',
        module: 'scale-sequences',
        route: '/learn/scale-sequences',
        audioRequired: true,
        prefill: {
          module: 'scale-sequences',
          presetId: 'pop-major-hooks',
          root: 'C',
          scaleName: 'Major',
          sequenceType: 'ascending',
          loops: 2
        },
        completionRule: { type: 'scale-sequence', minLoops: 2, sequenceType: 'ascending' }
      },
      {
        id: 'pop-hook-ear-step',
        title: 'Hook Recall Ear',
        description: 'Match the kinds of notes that sit at the center of a pop melody.',
        module: 'ear-training',
        route: '/learn/ear-training',
        audioRequired: true,
        prefill: { module: 'ear-training', mode: 'note', presetId: 'pop-hook-recall' },
        completionRule: { type: 'ear-accuracy', mode: 'note', minAccuracy: 70, minTotal: 4 }
      }
    ]
  },
  {
    id: 'funk-pocket-builder',
    title: 'Funk Pocket Builder',
    description: 'Develop clipped syncopation, dominant-pocket changes, and Mixolydian color.',
    genre: 'funk',
    difficulty: 'Intermediate',
    focusSkills: ['rhythm', 'groove', 'chords', 'timing'],
    recommendedTools: ['rhythm-trainer', 'chord-changes', 'chord-library', 'scale-sequences'],
    toneSuggestions: GENRE_DEFINITIONS.find((genre) => genre.id === 'funk')?.toneSuggestions,
    starterPresetIds: [
      'rhythm:muted-funk-chops',
      'chord-changes:funk-vamp',
      'scale-sequences:funk-mixolydian-pocket',
      'ear:funk-pocket-intervals'
    ],
    steps: [
      {
        id: 'funk-seven-focus',
        title: 'Minor-7 Focus',
        description: 'Settle a clipped Am7 voicing before adding faster groove movement.',
        module: 'chord-library',
        route: '/learn/chords',
        audioRequired: true,
        prefill: {
          module: 'chord-library',
          filterCategory: 'open',
          chordName: 'Am7',
          filterRoot: 'A'
        },
        completionRule: { type: 'chord-match-count', minMatches: 3, targetChord: 'Am7' }
      },
      {
        id: 'funk-chops-step',
        title: 'Muted Funk Chops',
        description: 'Keep sixteenth-note stabs short and accurate.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: {
          module: 'rhythm-trainer',
          patternName: 'Muted Funk Chops',
          bpm: 84,
          sensitivity: 'high'
        },
        completionRule: {
          type: 'rhythm-accuracy',
          minAccuracy: 68,
          patternName: 'Muted Funk Chops'
        }
      },
      {
        id: 'funk-vamp-step',
        title: 'Pocket Vamp',
        description: 'Move through dominant and minor-7 shapes without leaving the pocket.',
        module: 'chord-changes',
        route: '/learn/chord-changes',
        audioRequired: true,
        prefill: { module: 'chord-changes', presetId: 'funk-vamp', bpm: 88 },
        completionRule: { type: 'chord-changes', minSwitches: 4, presetId: 'funk-vamp' }
      },
      {
        id: 'funk-mixolydian-step',
        title: 'Mixolydian Pocket',
        description: 'Hear the dominant color tones inside a groove-friendly sequence.',
        module: 'scale-sequences',
        route: '/learn/scale-sequences',
        audioRequired: true,
        prefill: {
          module: 'scale-sequences',
          presetId: 'funk-mixolydian-pocket',
          root: 'A',
          scaleName: 'Mixolydian',
          sequenceType: 'thirds',
          loops: 2
        },
        completionRule: { type: 'scale-sequence', minLoops: 2, sequenceType: 'thirds' }
      },
      {
        id: 'funk-ear-step',
        title: 'Pocket Interval Ear',
        description: 'Hear short interval moves that sit tightly inside the groove.',
        module: 'ear-training',
        route: '/learn/ear-training',
        audioRequired: true,
        prefill: { module: 'ear-training', mode: 'interval', presetId: 'funk-pocket-intervals' },
        completionRule: { type: 'ear-accuracy', mode: 'interval', minAccuracy: 65, minTotal: 4 }
      }
    ]
  },
  {
    id: 'country-road-groove',
    title: 'Country Road Groove',
    description:
      'Build bright open-chord rhythm, train-beat timing, and major-pentatonic movement.',
    genre: 'country',
    difficulty: 'Developing',
    focusSkills: ['chords', 'rhythm', 'timing', 'scales'],
    recommendedTools: ['rhythm-trainer', 'chord-changes', 'scale-sequences', 'chord-library'],
    toneSuggestions: GENRE_DEFINITIONS.find((genre) => genre.id === 'country')?.toneSuggestions,
    starterPresetIds: [
      'rhythm:country-train-beat',
      'chord-changes:country-open-road',
      'scale-sequences:country-major-pentatonic-roll',
      'ear:country-resolve'
    ],
    steps: [
      {
        id: 'country-open-focus',
        title: 'Open G Focus',
        description: 'Anchor the open G sound before adding driving rhythm.',
        module: 'chord-library',
        route: '/learn/chords',
        audioRequired: true,
        prefill: {
          module: 'chord-library',
          filterCategory: 'open',
          chordName: 'G',
          filterRoot: 'G'
        },
        completionRule: { type: 'chord-match-count', minMatches: 3, targetChord: 'G' }
      },
      {
        id: 'country-train-step',
        title: 'Train Beat',
        description: 'Keep the boom-chick motion moving without rushing the upbeat.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: {
          module: 'rhythm-trainer',
          patternName: 'Country Train Beat',
          bpm: 100,
          sensitivity: 'mid'
        },
        completionRule: {
          type: 'rhythm-accuracy',
          minAccuracy: 72,
          patternName: 'Country Train Beat'
        }
      },
      {
        id: 'country-road-step',
        title: 'Open Road Changes',
        description: 'Cycle through a bright open-chord loop with confident landings.',
        module: 'chord-changes',
        route: '/learn/chord-changes',
        audioRequired: true,
        prefill: { module: 'chord-changes', presetId: 'country-open-road', bpm: 96 },
        completionRule: { type: 'chord-changes', minSwitches: 4, presetId: 'country-open-road' }
      },
      {
        id: 'country-pentatonic-step',
        title: 'Major Pentatonic Roll',
        description: 'Run a bright major-pentatonic line with even motion.',
        module: 'scale-sequences',
        route: '/learn/scale-sequences',
        audioRequired: true,
        prefill: {
          module: 'scale-sequences',
          presetId: 'country-major-pentatonic-roll',
          root: 'G',
          scaleName: 'Major Pentatonic',
          sequenceType: 'descending',
          loops: 2
        },
        completionRule: { type: 'scale-sequence', minLoops: 2, sequenceType: 'descending' }
      },
      {
        id: 'country-ear-step',
        title: 'Resolve by Ear',
        description: 'Hear bright interval movement that resolves inside open-chord harmony.',
        module: 'ear-training',
        route: '/learn/ear-training',
        audioRequired: true,
        prefill: { module: 'ear-training', mode: 'interval', presetId: 'country-resolve' },
        completionRule: { type: 'ear-accuracy', mode: 'interval', minAccuracy: 65, minTotal: 4 }
      }
    ]
  },
  {
    id: 'fingerpicking-foundations',
    title: 'Fingerpicking Foundations',
    description: 'Use alternating bass and arpeggio patterns to build steady fingerstyle motion.',
    genre: 'fingerpicking',
    difficulty: 'Beginner',
    focusSkills: ['fingerstyle', 'rhythm', 'technique', 'chords'],
    recommendedTools: ['rhythm-trainer', 'chord-changes', 'scale-sequences', 'ear-training'],
    toneSuggestions: GENRE_DEFINITIONS.find((genre) => genre.id === 'fingerpicking')
      ?.toneSuggestions,
    starterPresetIds: [
      'rhythm:alternating-bass',
      'rhythm:fingerpicked-arpeggio',
      'chord-changes:fingerpicked-open-roll',
      'scale-sequences:fingerpicked-arpeggio-map'
    ],
    steps: [
      {
        id: 'finger-alternating-bass-step',
        title: 'Alternating Bass Pulse',
        description: 'Use any consistent attack to map the bass-note pulse first.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: {
          module: 'rhythm-trainer',
          patternName: 'Alternating Bass',
          bpm: 72,
          sensitivity: 'mid'
        },
        completionRule: {
          type: 'rhythm-accuracy',
          minAccuracy: 72,
          patternName: 'Alternating Bass'
        }
      },
      {
        id: 'finger-arpeggio-step',
        title: 'Arpeggio Roll',
        description: 'Keep the picking hand even through a broken-chord roll.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: {
          module: 'rhythm-trainer',
          patternName: 'Fingerpicked Arpeggio',
          bpm: 68,
          sensitivity: 'mid'
        },
        completionRule: {
          type: 'rhythm-accuracy',
          minAccuracy: 70,
          patternName: 'Fingerpicked Arpeggio'
        }
      },
      {
        id: 'finger-open-roll-step',
        title: 'Open-Chord Roll',
        description: 'Cycle through a fingerpicked open-chord loop without collapsing the pattern.',
        module: 'chord-changes',
        route: '/learn/chord-changes',
        audioRequired: true,
        prefill: { module: 'chord-changes', presetId: 'fingerpicked-open-roll', bpm: 70 },
        completionRule: {
          type: 'chord-changes',
          minSwitches: 4,
          presetId: 'fingerpicked-open-roll'
        }
      },
      {
        id: 'finger-map-step',
        title: 'Arpeggio Map',
        description: 'Use a simple C major sequence to keep the right hand deliberate.',
        module: 'scale-sequences',
        route: '/learn/scale-sequences',
        audioRequired: true,
        prefill: {
          module: 'scale-sequences',
          presetId: 'fingerpicked-arpeggio-map',
          root: 'C',
          scaleName: 'Major',
          sequenceType: 'descending',
          loops: 2
        },
        completionRule: { type: 'scale-sequence', minLoops: 2, sequenceType: 'descending' }
      },
      {
        id: 'finger-open-strings-step',
        title: 'Open-String Ear',
        description: 'Match note centers that feel natural inside fingerpicked harmony.',
        module: 'ear-training',
        route: '/learn/ear-training',
        audioRequired: true,
        prefill: { module: 'ear-training', mode: 'note', presetId: 'fingerpicked-open-strings' },
        completionRule: { type: 'ear-accuracy', mode: 'note', minAccuracy: 70, minTotal: 4 }
      }
    ]
  }
]

export function buildLessonHref(step: LessonStep): string {
  return `${step.route}?lesson=${step.id}`
}

export function getVisibleGenres(): GenreDefinition[] {
  return GENRE_DEFINITIONS.filter((genre) => !genre.hidden)
}

export function getGenreDefinition(genreId: GenreId): GenreDefinition | undefined {
  return GENRE_DEFINITIONS.find((genre) => genre.id === genreId)
}

export function getPathsForGenre(genreId: GenreId): PracticePath[] {
  return PRACTICE_PATHS.filter((path) => path.genre === genreId)
}

export function getPathsForSkill(skillId: LearnSkillId): PracticePath[] {
  return PRACTICE_PATHS.filter((path) => path.focusSkills.includes(skillId))
}

export function getStarterPath(genreId: GenreId): PracticePath | undefined {
  const definition = getGenreDefinition(genreId)
  if (!definition?.starterPathId) return undefined
  return PRACTICE_PATHS.find((path) => path.id === definition.starterPathId)
}

export function getLessonStep(stepId: string | null): LessonStep | null {
  if (!stepId) return null

  for (const path of PRACTICE_PATHS) {
    const match = path.steps.find((step) => step.id === stepId)
    if (match) return match
  }

  return null
}

export function getChordChangePreset(presetId: string | null): ChordChangePreset | null {
  if (!presetId) return null
  return CHORD_CHANGE_PRESETS.find((preset) => preset.id === presetId) ?? null
}

export function getScaleSequencePreset(presetId: string | null): ScaleSequencePreset | null {
  if (!presetId) return null
  return SCALE_SEQUENCE_PRESETS.find((preset) => preset.id === presetId) ?? null
}

export function getEarTrainingPreset(presetId: string | null): EarTrainingPreset | null {
  if (!presetId) return null
  return EAR_TRAINING_PRESETS.find((preset) => preset.id === presetId) ?? null
}

export function getScaleIndexByName(scaleName: string): number {
  return Math.max(
    0,
    SCALES.findIndex((scale) => scale.name === scaleName)
  )
}

export function getPatternIndexByName(patternName: string): number {
  return Math.max(
    0,
    RHYTHM_PATTERNS.findIndex((pattern) => pattern.name === patternName)
  )
}

export function getChordIndexByName(chordName: string): number | null {
  const index = CHORD_VOICINGS.findIndex((voicing) => voicing.name === chordName)
  return index === -1 ? null : index
}

export function getModuleProgressValue(entry?: LearnProgressEntry): number {
  if (!entry) return 0
  if (entry.completionState === 'completed') return 100
  if (entry.completionState === 'in-progress') {
    if (entry.bestScore !== null) {
      return Math.max(35, Math.min(85, Math.round(entry.bestScore)))
    }
    return 55
  }
  return 0
}

export function isSetupReady(status: SystemStatus): boolean {
  return (
    status.permissionState !== 'denied' &&
    !!status.inputDeviceId &&
    status.isConnected &&
    ['healthy', 'hot', 'clipping'].includes(status.signalBand) &&
    status.latencyBand !== 'high'
  )
}

export function getPathProgress(
  path: PracticePath,
  completedSteps: Record<string, number>,
  status: SystemStatus
): { completedCount: number; totalCount: number; percent: number } {
  const completedCount = path.steps.filter((step) => {
    if (step.completionRule.type === 'setup-ready') {
      return isSetupReady(status)
    }

    return !!completedSteps[step.id]
  }).length

  return {
    completedCount,
    totalCount: path.steps.length,
    percent: Math.round((completedCount / path.steps.length) * 100)
  }
}

export function getGenreProgress(
  genreId: GenreId,
  completedSteps: Record<string, number>,
  status: SystemStatus
): { completedCount: number; totalCount: number; percent: number } {
  const paths = getPathsForGenre(genreId)
  const totals = paths.reduce(
    (accumulator, path) => {
      const progress = getPathProgress(path, completedSteps, status)
      return {
        completedCount: accumulator.completedCount + progress.completedCount,
        totalCount: accumulator.totalCount + progress.totalCount
      }
    },
    { completedCount: 0, totalCount: 0 }
  )

  return {
    ...totals,
    percent:
      totals.totalCount === 0 ? 0 : Math.round((totals.completedCount / totals.totalCount) * 100)
  }
}

export function getNextIncompleteStep(
  path: PracticePath,
  completedSteps: Record<string, number>,
  status: SystemStatus
): LessonStep | null {
  for (const step of path.steps) {
    const complete =
      step.completionRule.type === 'setup-ready' ? isSetupReady(status) : !!completedSteps[step.id]
    if (!complete) return step
  }

  return null
}

export function getContinueRoute(lastSession: SessionSummary | null): string | null {
  if (!lastSession) return null
  return MODULE_ROUTES[lastSession.module]
}
