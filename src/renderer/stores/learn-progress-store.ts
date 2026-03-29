import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  LearnModuleId,
  LearnProgressEntry,
  LessonCompletionRule,
  SessionSummary
} from '../utils/learn-types'
import { PRACTICE_PATHS } from '../utils/learn-data'
import { zustandStorage } from '../utils/store-storage'

interface LearnProgressState {
  progress: Record<string, LearnProgressEntry>
  completedSteps: Record<string, number>
  recordSession: (summary: SessionSummary, stepId?: string | null) => void
  markStepComplete: (stepId: string) => void
  reset: () => void
}

function createProgressEntry(module: LearnModuleId): LearnProgressEntry {
  return {
    id: module,
    attempts: 0,
    lastPracticedAt: null,
    bestScore: null,
    bestStreak: null,
    completionState: 'not-started',
    weakSpots: [],
    lastSession: null
  }
}

type PersistedLearnProgressState = Partial<Pick<LearnProgressState, 'progress' | 'completedSteps'>>

function withResumeDefaults(entry: LearnProgressEntry): LearnProgressEntry {
  if (!entry.lastSession) return entry

  return {
    ...entry,
    lastSession: {
      ...entry.lastSession,
      resumeHref: entry.lastSession.resumeHref ?? entry.lastSession.route,
      contextLabel: entry.lastSession.contextLabel
    }
  }
}

export function migrateLearnProgressState(
  persistedState: unknown,
  version: number
): PersistedLearnProgressState {
  const state = (persistedState as PersistedLearnProgressState | undefined) ?? {}
  if (version >= 1) return state

  const progress = Object.fromEntries(
    Object.entries(state.progress ?? {}).map(([module, entry]) => [
      module,
      withResumeDefaults(entry)
    ])
  )

  return {
    ...state,
    progress
  }
}

function findCompletionRule(stepId: string): LessonCompletionRule | null {
  for (const path of PRACTICE_PATHS) {
    const step = path.steps.find((item) => item.id === stepId)
    if (step) return step.completionRule
  }

  return null
}

function summaryMatchesRule(summary: SessionSummary, rule: LessonCompletionRule): boolean {
  switch (rule.type) {
    case 'setup-ready':
      return false
    case 'scale-notes-hit':
      return summary.module === 'scale-explorer' && summary.notesHit >= rule.minNotes
    case 'chord-match-count':
      return (
        summary.module === 'chord-library' &&
        summary.cleanMatchCount >= rule.minMatches &&
        (!rule.targetChord || summary.targetChord === rule.targetChord)
      )
    case 'rhythm-accuracy':
      return (
        summary.module === 'rhythm-trainer' &&
        summary.patternName === rule.patternName &&
        (summary.accuracy ?? 0) >= rule.minAccuracy
      )
    case 'ear-accuracy':
      return (
        summary.module === 'ear-training' &&
        summary.mode === rule.mode &&
        summary.total >= rule.minTotal &&
        (summary.accuracy ?? 0) >= rule.minAccuracy
      )
    case 'chord-changes':
      return (
        summary.module === 'chord-changes' &&
        summary.cleanSwitches >= rule.minSwitches &&
        (!rule.presetId || summary.presetId === rule.presetId)
      )
    case 'scale-sequence':
      return (
        summary.module === 'scale-sequences' &&
        summary.loopsCompleted >= rule.minLoops &&
        (!rule.sequenceType || summary.sequenceType === rule.sequenceType)
      )
  }
}

export const useLearnProgressStore = create<LearnProgressState>()(
  persist(
    (set) => ({
      progress: {},
      completedSteps: {},
      recordSession: (summary, stepId) =>
        set((state) => {
          const current = state.progress[summary.module] ?? createProgressEntry(summary.module)
          const rule = stepId ? findCompletionRule(stepId) : null
          const shouldComplete = rule ? summaryMatchesRule(summary, rule) : false

          return {
            progress: {
              ...state.progress,
              [summary.module]: {
                ...current,
                attempts: current.attempts + 1,
                lastPracticedAt: Date.now(),
                bestScore:
                  summary.score === null
                    ? current.bestScore
                    : current.bestScore === null
                      ? summary.score
                      : Math.max(current.bestScore, summary.score),
                bestStreak:
                  summary.bestStreak === null
                    ? current.bestStreak
                    : current.bestStreak === null
                      ? summary.bestStreak
                      : Math.max(current.bestStreak, summary.bestStreak),
                completionState:
                  summary.completionState === 'completed' || current.completionState === 'completed'
                    ? 'completed'
                    : 'in-progress',
                weakSpots: Array.from(new Set([...summary.weakSpots, ...current.weakSpots])).slice(
                  0,
                  6
                ),
                lastSession: summary
              }
            },
            completedSteps:
              stepId && shouldComplete
                ? { ...state.completedSteps, [stepId]: Date.now() }
                : state.completedSteps
          }
        }),
      markStepComplete: (stepId) =>
        set((state) => ({
          completedSteps: { ...state.completedSteps, [stepId]: Date.now() }
        })),
      reset: () =>
        set({
          progress: {},
          completedSteps: {}
        })
    }),
    {
      name: 'soundgarden-learn-progress',
      storage: zustandStorage,
      version: 1,
      migrate: migrateLearnProgressState
    }
  )
)
