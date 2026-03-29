import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ear, Play, RotateCcw } from 'lucide-react'
import { useEarTrainingStore } from '../../stores/ear-training-store'
import { useEarTraining } from '../../hooks/useEarTraining'
import { useLearnSession } from '../../hooks/useLearnSession'
import { PageHeader } from '../layout/PageHeader'
import { AudioRequiredState } from '../common/AudioRequiredState'
import { useLessonStep } from '../../hooks/useLessonStep'
import { LearnSessionSummary } from './LearnSessionSummary'
import {
  EAR_TRAINING_PRESETS,
  buildRouteWithParams,
  getEarTrainingPreset,
  getGenreDefinition,
  isEarTrainingPresetRecommendedForGenre
} from '../../utils/learn-data'
import type { CompletionState, GenreId } from '../../utils/learn-types'
import { GuidedStepBanner } from './GuidedStepBanner'
import { LearnStatCard } from './LearnStatCard'

const MODES = [
  {
    value: 'note' as const,
    label: 'Note',
    description: 'Hear one pitch, then match it back on the guitar.'
  },
  {
    value: 'interval' as const,
    label: 'Interval',
    description: 'Hear two tones, then play back the second note.'
  }
]

export function EarTrainingPanel(): JSX.Element {
  const [searchParams] = useSearchParams()
  const {
    mode,
    challengePresetId,
    currentChallenge,
    isListening,
    score,
    streak,
    bestStreak,
    total,
    missedTargets,
    lastResult,
    setMode,
    setChallengePresetId,
    reset
  } = useEarTrainingStore()
  const { newRound, playChallenge, listen, stopListening, isConnected } = useEarTraining()
  const lessonStep = useLessonStep('ear-training')
  const sessionStartedAt = useRef<number | null>(null)
  const appliedLessonId = useRef<string | null>(null)
  const appliedQueryKey = useRef<string | null>(null)
  const presetParam = searchParams.get('preset')
  const modeParam = searchParams.get('mode')
  const rawGenreContext = searchParams.get('genre')
  const genreContext =
    rawGenreContext && getGenreDefinition(rawGenreContext as GenreId)
      ? (rawGenreContext as GenreId)
      : null
  const genreLabel = genreContext ? (getGenreDefinition(genreContext)?.title ?? null) : null
  const selectedPreset = getEarTrainingPreset(challengePresetId)

  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  function buildSummary() {
    const completionState: CompletionState =
      accuracy !== null && accuracy >= 70 && total >= 4
        ? 'completed'
        : total > 0
          ? 'in-progress'
          : 'not-started'

    return {
      module: 'ear-training' as const,
      title: `${mode === 'note' ? 'Note' : 'Interval'} ear session`,
      description: `Answered ${score} correctly out of ${total} prompts.`,
      route: '/learn/ear-training',
      resumeHref: lessonStep
        ? buildRouteWithParams('/learn/ear-training', { lesson: lessonStep.id })
        : buildRouteWithParams('/learn/ear-training', {
            preset: challengePresetId,
            mode,
            genre: genreContext
          }),
      contextLabel:
        selectedPreset?.name ?? (mode === 'note' ? 'Note ear training' : 'Interval ear training'),
      score: accuracy,
      bestStreak,
      completionState,
      weakSpots: missedTargets.slice(0, 4),
      mode,
      accuracy,
      correct: score,
      total,
      missedTargets
    }
  }

  const { savedSummary, finalizeSession, startSession, resetSessionStart } = useLearnSession({
    module: 'ear-training',
    lessonStepId: lessonStep?.id,
    sessionKey: lessonStep
      ? null
      : `preset:${presetParam ?? ''}|mode:${modeParam ?? ''}|genre:${genreContext ?? ''}`,
    hasActivity: () => sessionStartedAt.current !== null || total > 0,
    buildSummary,
    sessionStartedAtRef: sessionStartedAt
  })

  useEffect(() => {
    if (!lessonStep || lessonStep.prefill.module !== 'ear-training') {
      appliedLessonId.current = null
      return
    }
    if (appliedLessonId.current === lessonStep.id) return
    if (lessonStep.prefill.mode !== mode) {
      setMode(lessonStep.prefill.mode)
    } else {
      reset()
    }
    setChallengePresetId(lessonStep.prefill.presetId ?? null)
    resetSessionStart()
    appliedLessonId.current = lessonStep.id
  }, [lessonStep, mode, reset, resetSessionStart, setChallengePresetId, setMode])

  useEffect(() => {
    if (lessonStep) {
      appliedQueryKey.current = null
      return
    }

    const queryKey = `preset:${presetParam ?? ''}|mode:${modeParam ?? ''}`
    if (appliedQueryKey.current === queryKey) return
    if (!presetParam && !modeParam) {
      appliedQueryKey.current = null
      return
    }

    const preset = presetParam ? getEarTrainingPreset(presetParam) : null
    const nextMode =
      preset?.mode ?? (modeParam === 'note' || modeParam === 'interval' ? modeParam : null)
    if (nextMode && nextMode !== mode) {
      setMode(nextMode)
    } else {
      reset()
    }
    setChallengePresetId(preset?.id ?? null)
    resetSessionStart()
    appliedQueryKey.current = queryKey
  }, [
    lessonStep,
    mode,
    modeParam,
    presetParam,
    reset,
    resetSessionStart,
    setChallengePresetId,
    setMode
  ])

  const displayedSummary =
    total > 0 ? buildSummary() : savedSummary?.module === 'ear-training' ? savedSummary : null

  if (!isConnected) {
    return <AudioRequiredState featureName="Ear training" />
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <PageHeader
        title="Ear Training"
        description="Replay the prompt as often as you need, then switch into listening mode and let Soundgarden judge the response."
        backTo="/learn"
        actions={
          <button
            onClick={() => {
              finalizeSession()
              reset()
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <RotateCcw size={14} />
            Reset Score
          </button>
        }
      />

      {lessonStep && (
        <GuidedStepBanner title={lessonStep.title} description={lessonStep.description} />
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <LearnStatCard label="Correct" value={String(score)} />
        <LearnStatCard label="Total" value={String(total)} />
        <LearnStatCard label="Accuracy" value={accuracy === null ? 'Waiting' : `${accuracy}%`} />
        <LearnStatCard label="Streak" value={String(streak)} />
      </div>

      <div className="flex flex-wrap gap-3">
        {MODES.map((modeOption) => (
          <button
            key={modeOption.value}
            onClick={() => {
              if (mode === modeOption.value) return
              finalizeSession()
              setMode(modeOption.value)
              sessionStartedAt.current = null
            }}
            className={`flex flex-col gap-1 rounded-2xl px-5 py-3 text-left transition-colors ${
              mode === modeOption.value
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <span className="text-sm font-medium">{modeOption.label}</span>
            <span className="text-xs opacity-75">{modeOption.description}</span>
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
        <div className="text-sm font-medium text-white">Prompt context</div>
        <p className="mt-1 text-sm text-zinc-400">
          Genre presets keep the ear work framed around a musical context without changing the core
          scoring rules.
        </p>
        {genreLabel && !lessonStep && (
          <p className="mt-2 text-sm text-emerald-200">
            Highlighting presets tagged for {genreLabel.toLowerCase()} practice.
          </p>
        )}
        <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {EAR_TRAINING_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                finalizeSession()
                if (preset.mode !== mode) {
                  setMode(preset.mode)
                } else {
                  reset()
                }
                setChallengePresetId(preset.id)
                resetSessionStart()
              }}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                challengePresetId === preset.id
                  ? 'border-emerald-400/60 bg-emerald-600 text-white'
                  : isEarTrainingPresetRecommendedForGenre(preset.id, genreContext)
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-zinc-100 hover:border-emerald-500/50'
                    : 'border-zinc-800 bg-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-medium">{preset.name}</div>
                <span className="rounded-full bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.18em]">
                  {preset.mode}
                </span>
              </div>
              <div className="mt-1 text-xs opacity-75">{preset.description}</div>
              <div className="mt-3 text-xs opacity-80">{preset.promptLabel}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8">
        {!currentChallenge ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="max-w-xl text-zinc-400">
              {mode === 'note'
                ? 'Start a round to hear one target note, then play it back cleanly on the guitar.'
                : 'Start a round to hear an interval, then play back the target note at the end of the prompt.'}
            </p>
            {selectedPreset && (
              <p className="max-w-xl text-sm text-zinc-500">{selectedPreset.promptLabel}</p>
            )}
            <button
              onClick={() => {
                startSession()
                void newRound()
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-500"
            >
              <Play size={18} />
              Start Round
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 text-center">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Current task</div>
              <p className="mt-2 text-sm text-zinc-300">
                {mode === 'note'
                  ? 'Replay the reference note, then listen for your answer.'
                  : `Replay the interval, then play back the target tone (${currentChallenge.intervalName}).`}
              </p>
              {selectedPreset && (
                <p className="mt-2 text-sm text-zinc-500">{selectedPreset.promptLabel}</p>
              )}
            </div>

            {lastResult && (
              <div
                className={`text-2xl font-bold ${
                  lastResult === 'correct' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {lastResult === 'correct' ? 'Correct!' : 'Not quite'}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => void playChallenge()}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-700 px-5 py-2 font-medium text-white transition-colors hover:bg-zinc-600"
              >
                <Play size={16} />
                Replay Prompt
              </button>

              {isListening ? (
                <button
                  onClick={stopListening}
                  className="inline-flex items-center gap-2 rounded-xl bg-yellow-600 px-5 py-2 font-medium text-white transition-colors hover:bg-yellow-500"
                >
                  <Ear size={16} />
                  Stop Listening
                </button>
              ) : (
                <button
                  onClick={() => {
                    startSession()
                    void listen()
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 font-medium text-white transition-colors hover:bg-emerald-500"
                >
                  <Ear size={16} />
                  Listen for Answer
                </button>
              )}

              {lastResult && (
                <button
                  onClick={() => void newRound()}
                  className="rounded-xl bg-zinc-700 px-5 py-2 font-medium text-white transition-colors hover:bg-zinc-600"
                >
                  Next Round
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {displayedSummary?.module === 'ear-training' && (
        <LearnSessionSummary
          title={displayedSummary.title}
          description={displayedSummary.description}
          metrics={[
            {
              label: 'Accuracy',
              value:
                displayedSummary.accuracy === null ? 'Waiting' : `${displayedSummary.accuracy}%`,
              tone:
                (displayedSummary.accuracy ?? 0) >= 70
                  ? 'good'
                  : (displayedSummary.accuracy ?? 0) >= 50
                    ? 'warning'
                    : 'default'
            },
            {
              label: 'Correct / total',
              value: `${displayedSummary.correct} / ${displayedSummary.total}`
            },
            {
              label: 'Mode',
              value: displayedSummary.mode === 'note' ? 'Note recall' : 'Interval recall'
            },
            { label: 'Best streak', value: String(displayedSummary.bestStreak ?? '—') }
          ]}
          weakSpots={displayedSummary.weakSpots}
        />
      )}
    </div>
  )
}
