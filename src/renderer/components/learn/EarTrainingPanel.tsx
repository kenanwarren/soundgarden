import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Ear, Play, RotateCcw } from 'lucide-react'
import { useEarTrainingStore } from '../../stores/ear-training-store'
import { useEarTraining } from '../../hooks/useEarTraining'
import { PageHeader } from '../layout/PageHeader'
import { AudioRequiredState } from '../common/AudioRequiredState'
import { useLessonStep } from '../../hooks/useLessonStep'
import { useLearnProgressStore } from '../../stores/learn-progress-store'
import { LearnSessionSummary } from './LearnSessionSummary'
import { EAR_TRAINING_PRESETS, getEarTrainingPreset } from '../../utils/learn-data'
import type { CompletionState } from '../../utils/learn-types'

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

function SummaryCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-medium text-white">{value}</div>
    </div>
  )
}

export function EarTrainingPanel(): JSX.Element {
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
  const recordSession = useLearnProgressStore((state) => state.recordSession)
  const savedSummary = useLearnProgressStore((state) => state.progress['ear-training']?.lastSession)
  const sessionStartedAt = useRef<number | null>(null)
  const appliedLessonId = useRef<string | null>(null)
  const selectedPreset = getEarTrainingPreset(challengePresetId)

  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  const buildSummary = useCallback(() => {
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
  }, [accuracy, bestStreak, missedTargets, mode, score, total])

  const finalizeSession = useCallback(() => {
    if (sessionStartedAt.current === null && total === 0) return
    recordSession(buildSummary(), lessonStep?.id)
    sessionStartedAt.current = null
  }, [buildSummary, lessonStep?.id, recordSession, total])

  useEffect(() => {
    if (!lessonStep || lessonStep.prefill.module !== 'ear-training') {
      appliedLessonId.current = null
      return
    }
    if (appliedLessonId.current === lessonStep.id) return
    finalizeSession()
    if (lessonStep.prefill.mode !== mode) {
      setMode(lessonStep.prefill.mode)
    } else {
      reset()
    }
    setChallengePresetId(lessonStep.prefill.presetId ?? null)
    sessionStartedAt.current = null
    appliedLessonId.current = lessonStep.id
  }, [finalizeSession, lessonStep, mode, reset, setChallengePresetId, setMode])

  useEffect(() => {
    return () => {
      finalizeSession()
    }
  }, [finalizeSession])

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
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          Guided step: <span className="font-medium text-white">{lessonStep.title}</span>.{' '}
          {lessonStep.description}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Correct" value={String(score)} />
        <SummaryCard label="Total" value={String(total)} />
        <SummaryCard label="Accuracy" value={accuracy === null ? 'Waiting' : `${accuracy}%`} />
        <SummaryCard label="Streak" value={String(streak)} />
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
                sessionStartedAt.current = null
              }}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                challengePresetId === preset.id
                  ? 'border-emerald-400/60 bg-emerald-600 text-white'
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
                if (sessionStartedAt.current === null) sessionStartedAt.current = Date.now()
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
                    if (sessionStartedAt.current === null) sessionStartedAt.current = Date.now()
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
