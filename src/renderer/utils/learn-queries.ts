import { CHORD_VOICINGS } from './chord-voicings'
import { RHYTHM_PATTERNS } from './rhythm-patterns'
import { SCALES } from './scale-data'
import { GENRE_DEFINITIONS } from './genres'
import { PRACTICE_PATHS } from './practice-paths'
import { CHORD_CHANGE_PRESETS } from './presets/chord-changes'
import { SCALE_SEQUENCE_PRESETS } from './presets/scale-sequences'
import { EAR_TRAINING_PRESETS } from './presets/ear-training'
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
import type { ChordChangePreset } from './presets/chord-changes'
import type { ScaleSequencePreset } from './presets/scale-sequences'
import type { EarTrainingPreset } from './presets/ear-training'

export const MODULE_ROUTES: Record<LearnModuleId, string> = {
  setup: '/',
  'scale-explorer': '/learn/scales',
  'chord-library': '/learn/chords',
  'rhythm-trainer': '/learn/rhythm',
  'ear-training': '/learn/ear-training',
  'chord-changes': '/learn/chord-changes',
  'scale-sequences': '/learn/scale-sequences',
  'song-viewer': '/learn/songs'
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
  },
  {
    to: '/learn/songs',
    module: 'song-viewer',
    title: 'Song Viewer',
    description: 'Browse public domain songs with chord charts and lyrics.'
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
      return !!completedSteps[step.id] || isSetupReady(status)
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
      step.completionRule.type === 'setup-ready'
        ? !!completedSteps[step.id] || isSetupReady(status)
        : !!completedSteps[step.id]
    if (!complete) return step
  }

  return null
}

export function getContinueRoute(lastSession: SessionSummary | null): string | null {
  if (!lastSession) return null
  return MODULE_ROUTES[lastSession.module]
}
