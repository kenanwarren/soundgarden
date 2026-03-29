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
  LearnBrowseMode,
  LearnHubView,
  LearnModuleId,
  LearnProgressEntry,
  LearnStarterDrill,
  LearnSkillId,
  LessonStep,
  LearnToolDefinition,
  PracticePath,
  SessionSummary
} from './learn-types'
import type { SystemStatus } from './system-status'
import type { ChordChangePreset } from './presets/chord-changes'
import type { ScaleSequencePreset } from './presets/scale-sequences'
import type { EarTrainingPreset } from './presets/ear-training'

export const LEARN_TOOL_DEFINITIONS: Record<LearnModuleId, LearnToolDefinition> = {
  setup: {
    module: 'setup',
    route: '/',
    title: 'Setup',
    description: 'Prepare audio routing, permission, and monitoring before you practice.'
  },
  'scale-explorer': {
    module: 'scale-explorer',
    route: '/learn/scales',
    title: 'Scale Explorer',
    description: 'Look up scale maps and switch into live note coverage when needed.'
  },
  'chord-library': {
    module: 'chord-library',
    route: '/learn/chords',
    title: 'Chord Library',
    description: 'Look up voicings, fingerings, and clean chord matches.'
  },
  'rhythm-trainer': {
    module: 'rhythm-trainer',
    route: '/learn/rhythm',
    title: 'Rhythm Patterns',
    description: 'Browse pattern shapes first, then measure timing and tendency.'
  },
  'ear-training': {
    module: 'ear-training',
    route: '/learn/ear-training',
    title: 'Ear Training',
    description: 'Train note and interval recognition with replayable prompts.'
  },
  'chord-changes': {
    module: 'chord-changes',
    route: '/learn/chord-changes',
    title: 'Chord Changes Trainer',
    description: 'Switch target chords against the clock and count clean changes.'
  },
  'scale-sequences': {
    module: 'scale-sequences',
    route: '/learn/scale-sequences',
    title: 'Scale Sequence Trainer',
    description: 'Play scales in order with ascending, descending, and thirds patterns.'
  },
  'song-viewer': {
    module: 'song-viewer',
    route: '/learn/songs',
    title: 'Song Viewer',
    description: 'Browse public domain songs with chord charts and lyrics.'
  }
}

export const MODULE_ROUTES: Record<LearnModuleId, string> = Object.fromEntries(
  Object.values(LEARN_TOOL_DEFINITIONS).map((definition) => [definition.module, definition.route])
) as Record<LearnModuleId, string>

export const LEARN_HUB_VIEWS: LearnHubView[] = ['overview', 'explore', 'tools']
export const LEARN_BROWSE_MODES: LearnBrowseMode[] = ['all', 'genre', 'skill']
export const LEARN_HUB_ROUTES: Record<LearnHubView, string> = {
  overview: '/learn',
  explore: '/learn/explore',
  tools: '/learn/tools'
}

export const LEARN_FEATURES: Array<{
  to: string
  module: LearnModuleId
  title: string
  description: string
}> = [
  {
    to: LEARN_TOOL_DEFINITIONS['scale-explorer'].route,
    module: LEARN_TOOL_DEFINITIONS['scale-explorer'].module,
    title: LEARN_TOOL_DEFINITIONS['scale-explorer'].title,
    description: LEARN_TOOL_DEFINITIONS['scale-explorer'].description
  },
  {
    to: LEARN_TOOL_DEFINITIONS['chord-library'].route,
    module: LEARN_TOOL_DEFINITIONS['chord-library'].module,
    title: LEARN_TOOL_DEFINITIONS['chord-library'].title,
    description: LEARN_TOOL_DEFINITIONS['chord-library'].description
  },
  {
    to: LEARN_TOOL_DEFINITIONS['rhythm-trainer'].route,
    module: LEARN_TOOL_DEFINITIONS['rhythm-trainer'].module,
    title: LEARN_TOOL_DEFINITIONS['rhythm-trainer'].title,
    description: LEARN_TOOL_DEFINITIONS['rhythm-trainer'].description
  },
  {
    to: LEARN_TOOL_DEFINITIONS['ear-training'].route,
    module: LEARN_TOOL_DEFINITIONS['ear-training'].module,
    title: LEARN_TOOL_DEFINITIONS['ear-training'].title,
    description: LEARN_TOOL_DEFINITIONS['ear-training'].description
  },
  {
    to: LEARN_TOOL_DEFINITIONS['chord-changes'].route,
    module: LEARN_TOOL_DEFINITIONS['chord-changes'].module,
    title: LEARN_TOOL_DEFINITIONS['chord-changes'].title,
    description: LEARN_TOOL_DEFINITIONS['chord-changes'].description
  },
  {
    to: LEARN_TOOL_DEFINITIONS['scale-sequences'].route,
    module: LEARN_TOOL_DEFINITIONS['scale-sequences'].module,
    title: LEARN_TOOL_DEFINITIONS['scale-sequences'].title,
    description: LEARN_TOOL_DEFINITIONS['scale-sequences'].description
  },
  {
    to: LEARN_TOOL_DEFINITIONS['song-viewer'].route,
    module: LEARN_TOOL_DEFINITIONS['song-viewer'].module,
    title: LEARN_TOOL_DEFINITIONS['song-viewer'].title,
    description: LEARN_TOOL_DEFINITIONS['song-viewer'].description
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

function getGenreDefinitionMap(): Map<GenreId, GenreDefinition> {
  return new Map(GENRE_DEFINITIONS.map((genre) => [genre.id, genre]))
}

function getPracticePathsByGenreMap(): Map<GenreId, PracticePath[]> {
  return new Map(
    GENRE_DEFINITIONS.map((genre) => [
      genre.id,
      PRACTICE_PATHS.filter((path) => path.genre === genre.id)
    ])
  )
}

function getPracticePathsBySkillMap(): Map<LearnSkillId, PracticePath[]> {
  return new Map(
    LEARN_SKILLS.map((skill) => [
      skill.id,
      PRACTICE_PATHS.filter((path) => path.focusSkills.includes(skill.id))
    ])
  )
}

function getLessonStepMap(): Map<string, LessonStep> {
  const lessonStepsById = new Map<string, LessonStep>()

  for (const path of PRACTICE_PATHS) {
    for (const step of path.steps) {
      lessonStepsById.set(step.id, step)
    }
  }

  return lessonStepsById
}

function getChordChangePresetMap(): Map<string, ChordChangePreset> {
  return new Map(CHORD_CHANGE_PRESETS.map((preset) => [preset.id, preset]))
}

function getScaleSequencePresetMap(): Map<string, ScaleSequencePreset> {
  return new Map(SCALE_SEQUENCE_PRESETS.map((preset) => [preset.id, preset]))
}

function getEarTrainingPresetMap(): Map<string, EarTrainingPreset> {
  return new Map(EAR_TRAINING_PRESETS.map((preset) => [preset.id, preset]))
}

function getRhythmPatternNameMap() {
  return new Map(RHYTHM_PATTERNS.map((pattern) => [pattern.name, pattern]))
}

function getRhythmPatternStarterIdMap() {
  return new Map(RHYTHM_PATTERNS.map((pattern) => [buildRhythmStarterId(pattern.name), pattern]))
}

function getScaleIndexMap(): Map<string, number> {
  return new Map(SCALES.map((scale, index) => [scale.name, index]))
}

function getChordIndexMap(): Map<string, number> {
  return new Map(CHORD_VOICINGS.map((voicing, index) => [voicing.name, index]))
}

export function buildRouteWithParams(
  path: string,
  params: Record<string, string | number | null | undefined>
): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    searchParams.set(key, String(value))
  }

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export function buildLearnHubHref(
  options: {
    view?: LearnHubView
    browse?: LearnBrowseMode | null
    genre?: GenreId | null
    skill?: LearnSkillId | null
  } = {}
): string {
  const view = options.view ?? 'overview'
  return buildRouteWithParams(LEARN_HUB_ROUTES[view], {
    browse: options.browse ?? null,
    genre: options.genre ?? null,
    skill: options.skill ?? null
  })
}

export function buildLessonHref(step: LessonStep): string {
  return buildRouteWithParams(step.route, { lesson: step.id })
}

export function buildRhythmStarterId(patternName: string): string {
  return patternName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getVisibleGenres(): GenreDefinition[] {
  return GENRE_DEFINITIONS.filter((genre) => !genre.hidden)
}

export function getGenreDefinition(genreId: GenreId): GenreDefinition | undefined {
  return getGenreDefinitionMap().get(genreId)
}

export function getPathsForGenre(genreId: GenreId): PracticePath[] {
  return getPracticePathsByGenreMap().get(genreId) ?? []
}

export function getPathsForSkill(skillId: LearnSkillId): PracticePath[] {
  return getPracticePathsBySkillMap().get(skillId) ?? []
}

export function getStarterPath(genreId: GenreId): PracticePath | undefined {
  const definition = getGenreDefinition(genreId)
  if (!definition?.starterPathId) return undefined
  return PRACTICE_PATHS.find((path) => path.id === definition.starterPathId)
}

export function getLessonStep(stepId: string | null): LessonStep | null {
  if (!stepId) return null
  return getLessonStepMap().get(stepId) ?? null
}

export function getChordChangePreset(presetId: string | null): ChordChangePreset | null {
  if (!presetId) return null
  return getChordChangePresetMap().get(presetId) ?? null
}

export function getScaleSequencePreset(presetId: string | null): ScaleSequencePreset | null {
  if (!presetId) return null
  return getScaleSequencePresetMap().get(presetId) ?? null
}

export function getEarTrainingPreset(presetId: string | null): EarTrainingPreset | null {
  if (!presetId) return null
  return getEarTrainingPresetMap().get(presetId) ?? null
}

export function getScaleIndexByName(scaleName: string): number {
  return getScaleIndexMap().get(scaleName) ?? 0
}

export function getPatternIndexByName(patternName: string): number {
  return Math.max(
    0,
    RHYTHM_PATTERNS.findIndex((pattern) => pattern.name === patternName)
  )
}

export function getRhythmPatternByStarterId(starterId: string) {
  return getRhythmPatternStarterIdMap().get(starterId) ?? null
}

export function getChordIndexByName(chordName: string): number | null {
  const index = getChordIndexMap().get(chordName) ?? -1
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
  return lastSession.resumeHref || lastSession.route || MODULE_ROUTES[lastSession.module]
}

export function getStarterDrillsForPath(path: PracticePath): LearnStarterDrill[] {
  return (path.starterPresetIds ?? []).reduce<LearnStarterDrill[]>((drills, starterPresetId) => {
    const [kind, rawId] = starterPresetId.split(':')
    if (!kind || !rawId) return drills

    switch (kind) {
      case 'rhythm': {
        const pattern = getRhythmPatternByStarterId(rawId)
        if (!pattern) return drills
        drills.push({
          id: starterPresetId,
          kind: 'rhythm' as const,
          module: 'rhythm-trainer' as const,
          title: pattern.name,
          description: pattern.description,
          href: buildRouteWithParams(MODULE_ROUTES['rhythm-trainer'], {
            pattern: rawId,
            genre: path.genre
          }),
          genreId: path.genre
        })
        return drills
      }
      case 'chord-changes': {
        const preset = getChordChangePreset(rawId)
        if (!preset) return drills
        drills.push({
          id: starterPresetId,
          kind: 'chord-changes' as const,
          module: 'chord-changes' as const,
          title: preset.name,
          description: preset.description,
          href: buildRouteWithParams(MODULE_ROUTES['chord-changes'], {
            preset: preset.id,
            genre: path.genre
          }),
          genreId: path.genre
        })
        return drills
      }
      case 'scale-sequences': {
        const preset = getScaleSequencePreset(rawId)
        if (!preset) return drills
        drills.push({
          id: starterPresetId,
          kind: 'scale-sequences' as const,
          module: 'scale-sequences' as const,
          title: preset.name,
          description: preset.description,
          href: buildRouteWithParams(MODULE_ROUTES['scale-sequences'], {
            preset: preset.id,
            genre: path.genre
          }),
          genreId: path.genre
        })
        return drills
      }
      case 'ear': {
        const preset = getEarTrainingPreset(rawId)
        if (!preset) return drills
        drills.push({
          id: starterPresetId,
          kind: 'ear' as const,
          module: 'ear-training' as const,
          title: preset.name,
          description: preset.description,
          href: buildRouteWithParams(MODULE_ROUTES['ear-training'], {
            preset: preset.id,
            genre: path.genre
          }),
          genreId: path.genre
        })
        return drills
      }
      default:
        return drills
    }
  }, [])
}

export function isRhythmPatternRecommendedForGenre(
  patternName: string,
  genreId: GenreId | null
): boolean {
  if (!genreId) return false
  const pattern = getRhythmPatternNameMap().get(patternName)
  return pattern?.genreTags?.includes(genreId) ?? false
}

export function isChordChangePresetRecommendedForGenre(
  presetId: string,
  genreId: GenreId | null
): boolean {
  if (!genreId) return false
  return getChordChangePreset(presetId)?.genreTags.includes(genreId) ?? false
}

export function isScaleSequencePresetRecommendedForGenre(
  presetId: string | null,
  genreId: GenreId | null
): boolean {
  if (!genreId || !presetId) return false
  return getScaleSequencePreset(presetId)?.genreTags.includes(genreId) ?? false
}

export function isEarTrainingPresetRecommendedForGenre(
  presetId: string | null,
  genreId: GenreId | null
): boolean {
  if (!genreId || !presetId) return false
  return getEarTrainingPreset(presetId)?.genreTags.includes(genreId) ?? false
}
