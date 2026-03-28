import { CHORD_VOICINGS } from './chord-voicings'
import { RHYTHM_PATTERNS } from './rhythm-patterns'
import { SCALES } from './scale-data'
import type {
  LearnModuleId,
  LearnProgressEntry,
  LessonStep,
  PracticePath,
  SessionSummary
} from './learn-types'
import type { SystemStatus } from './system-status'

export interface ChordChangePreset {
  id: string
  name: string
  description: string
  chordNames: string[]
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

export const CHORD_CHANGE_PRESETS: ChordChangePreset[] = [
  {
    id: 'open-two',
    name: 'Open Two-Chord Loop',
    description: 'Lock in a clean C to G switch every measure.',
    chordNames: ['C', 'G']
  },
  {
    id: 'pop-four',
    name: 'Pop Four-Chord Loop',
    description: 'Cycle through C, G, Am, and F with steady changes.',
    chordNames: ['C', 'G', 'Am', 'F']
  },
  {
    id: 'dominant-ladder',
    name: 'Dominant Ladder',
    description: 'Move across A7, D7, and E7 with confident transitions.',
    chordNames: ['A7', 'D7', 'E7']
  }
]

export const PRACTICE_PATHS: PracticePath[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    description: 'Get connected, lock in a core chord, then add rhythm, ear, and scale basics.',
    difficulty: 'Beginner',
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
        prefill: { module: 'chord-library', filterCategory: 'open', chordName: 'C', filterRoot: 'C' },
        completionRule: { type: 'chord-match-count', minMatches: 3, targetChord: 'C' }
      },
      {
        id: 'foundations-quarter-notes',
        title: 'Quarter-Note Pulse',
        description: 'Build dependable downbeats before adding denser rhythms.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: { module: 'rhythm-trainer', patternName: 'Quarter Notes', bpm: 80, sensitivity: 'mid' },
        completionRule: { type: 'rhythm-accuracy', minAccuracy: 75, patternName: 'Quarter Notes' }
      },
      {
        id: 'foundations-eighth-notes',
        title: 'Eighth-Note Flow',
        description: 'Add steady down-up motion while keeping attacks on time.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: { module: 'rhythm-trainer', patternName: 'Eighth Notes', bpm: 82, sensitivity: 'mid' },
        completionRule: { type: 'rhythm-accuracy', minAccuracy: 70, patternName: 'Eighth Notes' }
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
    difficulty: 'Developing',
    steps: [
      {
        id: 'timing-quarter-notes',
        title: 'Quarter-Note Check-In',
        description: 'Start with a simple pulse and tighten the hit window.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: { module: 'rhythm-trainer', patternName: 'Quarter Notes', bpm: 90, sensitivity: 'mid' },
        completionRule: { type: 'rhythm-accuracy', minAccuracy: 80, patternName: 'Quarter Notes' }
      },
      {
        id: 'timing-eighth-notes',
        title: 'Eighth-Note Engine',
        description: 'Hold even subdivisions without drifting ahead or behind.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: { module: 'rhythm-trainer', patternName: 'Eighth Notes', bpm: 92, sensitivity: 'mid' },
        completionRule: { type: 'rhythm-accuracy', minAccuracy: 76, patternName: 'Eighth Notes' }
      },
      {
        id: 'timing-syncopation',
        title: 'Basic Syncopation',
        description: 'Land the off-beat pushes without losing the pulse.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: { module: 'rhythm-trainer', patternName: 'Basic Syncopation', bpm: 90, sensitivity: 'mid' },
        completionRule: { type: 'rhythm-accuracy', minAccuracy: 70, patternName: 'Basic Syncopation' }
      },
      {
        id: 'timing-shuffle',
        title: 'Shuffle Feel',
        description: 'Shift into triplet feel and keep the swing consistent.',
        module: 'rhythm-trainer',
        route: '/learn/rhythm',
        audioRequired: true,
        prefill: { module: 'rhythm-trainer', patternName: 'Shuffle', bpm: 84, sensitivity: 'high' },
        completionRule: { type: 'rhythm-accuracy', minAccuracy: 66, patternName: 'Shuffle' }
      }
    ]
  },
  {
    id: 'chord-fluency',
    title: 'Chord Fluency',
    description: 'Move from open shapes into sevenths, barres, and timed chord changes.',
    difficulty: 'Intermediate',
    steps: [
      {
        id: 'chord-fluency-open-major',
        title: 'Open Major Control',
        description: 'Match the open G voicing cleanly and consistently.',
        module: 'chord-library',
        route: '/learn/chords',
        audioRequired: true,
        prefill: { module: 'chord-library', filterCategory: 'open', chordName: 'G', filterRoot: 'G' },
        completionRule: { type: 'chord-match-count', minMatches: 3, targetChord: 'G' }
      },
      {
        id: 'chord-fluency-open-minor',
        title: 'Open Minor Control',
        description: 'Settle on Am without extra strings or muddy attacks.',
        module: 'chord-library',
        route: '/learn/chords',
        audioRequired: true,
        prefill: { module: 'chord-library', filterCategory: 'open', chordName: 'Am', filterRoot: 'A' },
        completionRule: { type: 'chord-match-count', minMatches: 3, targetChord: 'Am' }
      },
      {
        id: 'chord-fluency-seventh',
        title: 'Seventh Chord Focus',
        description: 'Hear and hit the dominant A7 shape cleanly.',
        module: 'chord-library',
        route: '/learn/chords',
        audioRequired: true,
        prefill: { module: 'chord-library', filterCategory: 'open', chordName: 'A7', filterRoot: 'A' },
        completionRule: { type: 'chord-match-count', minMatches: 3, targetChord: 'A7' }
      },
      {
        id: 'chord-fluency-barre',
        title: 'Barre Intro',
        description: 'Stabilise an F barre shape before moving into changes.',
        module: 'chord-library',
        route: '/learn/chords',
        audioRequired: true,
        prefill: { module: 'chord-library', filterCategory: 'barre', chordName: 'F', filterRoot: 'F' },
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
  }
]

export function buildLessonHref(step: LessonStep): string {
  return `${step.route}?lesson=${step.id}`
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
