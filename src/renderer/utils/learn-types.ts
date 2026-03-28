export type LearnModuleId =
  | 'setup'
  | 'scale-explorer'
  | 'chord-library'
  | 'rhythm-trainer'
  | 'ear-training'
  | 'chord-changes'
  | 'scale-sequences'
  | 'song-viewer'

export type GenreId = 'general' | 'blues' | 'rock' | 'pop' | 'funk' | 'country' | 'fingerpicking'

export type LearnSkillId =
  | 'chords'
  | 'scales'
  | 'rhythm'
  | 'ear'
  | 'timing'
  | 'groove'
  | 'technique'
  | 'fingerstyle'

export type Instrument = 'lead-guitar' | 'rhythm-guitar' | 'bass'

export type CompletionState = 'not-started' | 'in-progress' | 'completed'

export type DifficultyTier = 'Beginner' | 'Intermediate' | 'Advanced'
export type DifficultyGrade = 1 | 2 | 3

export interface PracticeDifficulty {
  tier: DifficultyTier
  grade: DifficultyGrade
}

export type LessonPrefill =
  | { module: 'setup' }
  | { module: 'scale-explorer'; root: string; scaleName: string }
  | {
      module: 'chord-library'
      filterCategory: 'all' | 'open' | 'barre' | 'extended'
      chordName?: string
      filterRoot?: string
    }
  | {
      module: 'rhythm-trainer'
      patternName: string
      bpm?: number
      sensitivity?: 'low' | 'mid' | 'high'
    }
  | { module: 'ear-training'; mode: 'note' | 'interval'; presetId?: string }
  | { module: 'chord-changes'; presetId: string; bpm?: number }
  | {
      module: 'scale-sequences'
      root: string
      scaleName: string
      sequenceType: 'ascending' | 'descending' | 'thirds'
      loops?: number
      presetId?: string
    }

export type LessonCompletionRule =
  | { type: 'setup-ready' }
  | { type: 'scale-notes-hit'; minNotes: number }
  | { type: 'chord-match-count'; minMatches: number; targetChord?: string }
  | { type: 'rhythm-accuracy'; minAccuracy: number; patternName: string }
  | { type: 'ear-accuracy'; mode: 'note' | 'interval'; minAccuracy: number; minTotal: number }
  | { type: 'chord-changes'; minSwitches: number; presetId?: string }
  | {
      type: 'scale-sequence'
      minLoops: number
      sequenceType?: 'ascending' | 'descending' | 'thirds'
    }

export interface LessonStep {
  id: string
  title: string
  description: string
  module: LearnModuleId
  route: string
  audioRequired: boolean
  prefill: LessonPrefill
  completionRule: LessonCompletionRule
}

export interface GenreDefinition {
  id: GenreId
  title: string
  description: string
  shortSummary: string
  starterPathId?: string
  focusSkills: LearnSkillId[]
  recommendedTools: LearnModuleId[]
  toneSuggestions: string[]
  hidden?: boolean
}

export interface PracticePath {
  id: string
  title: string
  description: string
  genre: GenreId
  difficulty: PracticeDifficulty
  focusSkills: LearnSkillId[]
  recommendedTools: LearnModuleId[]
  toneSuggestions?: string[]
  starterPresetIds?: string[]
  steps: LessonStep[]
}

export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'thirtySecond'

export type NoteTechnique =
  | 'hammer-on'
  | 'pull-off'
  | 'slide-up'
  | 'slide-down'
  | 'bend'
  | 'vibrato'
  | 'harmonic'
  | 'palm-mute'
  | 'mute'
  | 'accent'
  | 'tap'
  | 'slap'
  | 'pop'

export interface NotationNote {
  pitch: string
  duration: NoteDuration
  dotted?: boolean
  tied?: boolean
  tab?: { string: number; fret: number }
  technique?: NoteTechnique[]
  simultaneous?: Array<{ pitch: string; tab?: { string: number; fret: number } }>
}

export interface NotationMeasure {
  notes: NotationNote[]
  chord?: string
  lyricFragment?: string
  tempo?: number
}

export interface SongNotation {
  timeSignature: [number, number]
  tempo?: number
  measures: NotationMeasure[]
}

export interface SongArrangement {
  id: string
  instrument?: Instrument
  label: string
  isDefault: boolean
  difficulty: PracticeDifficulty
  key: string
  chords: string[]
  attribution: string
  lines: string[]
  notation?: SongNotation
  tuning?: string
  capo?: number
}

export interface SongDefinition {
  id: string
  title: string
  genres: GenreId[]
  difficulty: PracticeDifficulty
  key: string
  chords: string[]
  attribution: string
  lines: string[]
  notation?: SongNotation
  tuning?: string
  capo?: number
  variantOf?: string
  variantLabel?: string
  arrangements?: SongArrangement[]
}

interface BaseSessionSummary {
  module: LearnModuleId
  title: string
  description: string
  route: string
  score: number | null
  bestStreak: number | null
  completionState: CompletionState
  weakSpots: string[]
}

export interface ScaleSessionSummary extends BaseSessionSummary {
  module: 'scale-explorer'
  notesHit: number
  totalNotes: number
  timeSpentMs: number
  missedNotes: string[]
  root: string
  scaleName: string
}

export interface ChordLibrarySessionSummary extends BaseSessionSummary {
  module: 'chord-library'
  targetChord: string
  cleanMatchCount: number
  mismatches: string[]
}

export interface RhythmSessionSummary extends BaseSessionSummary {
  module: 'rhythm-trainer'
  patternName: string
  accuracy: number | null
  hitCount: number
  missCount: number
  tendencyLabel: string
}

export interface EarTrainingSessionSummary extends BaseSessionSummary {
  module: 'ear-training'
  mode: 'note' | 'interval'
  accuracy: number | null
  correct: number
  total: number
  missedTargets: string[]
}

export interface ChordChangesSessionSummary extends BaseSessionSummary {
  module: 'chord-changes'
  presetId: string
  presetName: string
  cleanSwitches: number
  mismatches: string[]
  bpm: number
}

export interface ScaleSequenceSessionSummary extends BaseSessionSummary {
  module: 'scale-sequences'
  root: string
  scaleName: string
  sequenceType: 'ascending' | 'descending' | 'thirds'
  loopsCompleted: number
  targetLoops: number
  missedNotes: string[]
}

export type SessionSummary =
  | ScaleSessionSummary
  | ChordLibrarySessionSummary
  | RhythmSessionSummary
  | EarTrainingSessionSummary
  | ChordChangesSessionSummary
  | ScaleSequenceSessionSummary

export interface LearnProgressEntry {
  id: LearnModuleId
  attempts: number
  lastPracticedAt: number | null
  bestScore: number | null
  bestStreak: number | null
  completionState: CompletionState
  weakSpots: string[]
  lastSession: SessionSummary | null
}
