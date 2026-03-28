export type LearnModuleId =
  | 'setup'
  | 'scale-explorer'
  | 'chord-library'
  | 'rhythm-trainer'
  | 'ear-training'
  | 'chord-changes'
  | 'scale-sequences'

export type CompletionState = 'not-started' | 'in-progress' | 'completed'
export type PracticeDifficulty = 'Beginner' | 'Developing' | 'Intermediate'

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
  | { module: 'ear-training'; mode: 'note' | 'interval' }
  | { module: 'chord-changes'; presetId: string; bpm?: number }
  | {
      module: 'scale-sequences'
      root: string
      scaleName: string
      sequenceType: 'ascending' | 'descending' | 'thirds'
      loops?: number
    }

export type LessonCompletionRule =
  | { type: 'setup-ready' }
  | { type: 'scale-notes-hit'; minNotes: number }
  | { type: 'chord-match-count'; minMatches: number; targetChord?: string }
  | { type: 'rhythm-accuracy'; minAccuracy: number; patternName: string }
  | { type: 'ear-accuracy'; mode: 'note' | 'interval'; minAccuracy: number; minTotal: number }
  | { type: 'chord-changes'; minSwitches: number; presetId?: string }
  | { type: 'scale-sequence'; minLoops: number; sequenceType?: 'ascending' | 'descending' | 'thirds' }

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

export interface PracticePath {
  id: string
  title: string
  description: string
  difficulty: PracticeDifficulty
  steps: LessonStep[]
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
