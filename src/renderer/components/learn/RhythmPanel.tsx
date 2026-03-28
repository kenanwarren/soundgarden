import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import { RHYTHM_PATTERNS } from '../../utils/rhythm-patterns'
import {
  useRhythmStore,
  type HitGrade,
  type TimingResult,
  type Sensitivity
} from '../../stores/rhythm-store'
import { useMetronomeStore } from '../../stores/metronome-store'
import { useRhythmTrainer } from '../../hooks/useRhythmTrainer'
import { useMetronome } from '../../hooks/useMetronome'
import { PageHeader } from '../layout/PageHeader'
import { BpmControl } from '../common/BpmControl'
import { AudioRequiredState } from '../common/AudioRequiredState'
import { useLessonStep } from '../../hooks/useLessonStep'
import { getPatternIndexByName } from '../../utils/learn-data'
import { useLearnProgressStore } from '../../stores/learn-progress-store'
import { LearnSessionSummary } from './LearnSessionSummary'
import type { CompletionState } from '../../utils/learn-types'

const GRADE_CONFIG: Record<HitGrade, { label: string; color: string }> = {
  perfect: { label: 'Perfect!', color: 'text-emerald-400' },
  great: { label: 'Great!', color: 'text-green-400' },
  good: { label: 'Good', color: 'text-yellow-400' },
  miss: { label: 'Miss', color: 'text-red-400' }
}

function getTimingInsights(results: TimingResult[]): {
  consistency: number | null
  tendency: number | null
} {
  const hits = results.filter(
    (result): result is Extract<TimingResult, { type: 'hit' }> => result.type === 'hit'
  )

  if (hits.length < 2) return { consistency: null, tendency: null }

  const deltas = hits.map((result) => result.deltaMs)
  const mean = deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length
  const variance = deltas.reduce((sum, delta) => sum + (delta - mean) ** 2, 0) / deltas.length

  return {
    consistency: Math.round(Math.sqrt(variance)),
    tendency: Math.round(mean)
  }
}

function tendencyLabel(tendency: number | null): string {
  if (tendency === null || Math.abs(tendency) < 5) return 'On time'
  return tendency < 0 ? `Rushing ${Math.abs(tendency)}ms` : `Dragging ${tendency}ms`
}

function HitFeedbackMessage({ grade }: { grade: HitGrade }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), 600)
    return () => clearTimeout(id)
  }, [])

  const cfg = GRADE_CONFIG[grade]

  return (
    <div
      className={`h-10 text-center text-2xl font-bold transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${cfg.color}`}
    >
      {cfg.label}
    </div>
  )
}

function HitFeedback({ grade, time }: { grade: HitGrade | null; time: number }) {
  if (!grade || time === 0) return null
  return <HitFeedbackMessage key={time} grade={grade} />
}

function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i <= level ? 'bg-emerald-500' : 'bg-zinc-700'}`}
        />
      ))}
    </span>
  )
}

function BeatGrid({
  pattern,
  isRunning,
  currentSubdivision
}: {
  pattern: (typeof RHYTHM_PATTERNS)[number]
  isRunning: boolean
  currentSubdivision: number
}) {
  const gridMinWidth = pattern.hits.length * 56 + Math.max(pattern.beatsPerMeasure - 1, 0) * 20

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="overflow-x-auto pb-2">
        <div
          className="mx-auto flex min-w-max items-center justify-center gap-6"
          style={{ minWidth: `${gridMinWidth}px` }}
        >
          {Array.from({ length: pattern.beatsPerMeasure }, (_, beat) => {
            const startIdx = beat * pattern.subdivisions
            const subs = pattern.hits.slice(startIdx, startIdx + pattern.subdivisions)
            return (
              <div key={beat} className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1">
                  {subs.map((isHit, subIdx) => {
                    const globalIdx = startIdx + subIdx
                    const isOnBeat = subIdx === 0
                    const isDown = subIdx % 2 === 0
                    const isCurrent = isRunning && globalIdx === currentSubdivision

                    return (
                      <div
                        key={globalIdx}
                        className={`flex items-center justify-center rounded transition-all ${
                          isOnBeat ? 'h-12 w-12' : 'h-9 w-9'
                        } ${
                          isCurrent
                            ? isHit
                              ? 'scale-110 bg-emerald-500 ring-2 ring-emerald-300'
                              : 'scale-105 bg-zinc-500 ring-2 ring-zinc-400'
                            : isHit
                              ? isDown
                                ? 'border-2 border-emerald-500 bg-emerald-700/60'
                                : 'border-2 border-sky-500 bg-sky-700/50'
                              : 'border border-zinc-700/50 bg-zinc-800/50'
                        }`}
                      >
                        {isHit ? (
                          <span
                            className={`font-bold ${isOnBeat ? 'text-base' : 'text-sm'} ${
                              isCurrent
                                ? 'text-white'
                                : isDown
                                  ? 'text-emerald-300'
                                  : 'text-sky-300'
                            }`}
                          >
                            {isDown ? '▼' : '▲'}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">·</span>
                        )}
                      </div>
                    )
                  })}
                </div>
                <span className="text-xs font-mono text-zinc-500">{beat + 1}</span>
              </div>
            )
          })}
        </div>
      </div>
      {pattern.subdivisions > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="text-emerald-400">▼</span> downbeat
          </span>
          <span className="flex items-center gap-1">
            <span className="text-sky-400">▲</span> upbeat
          </span>
          <span className="flex items-center gap-1">
            <span className="text-zinc-600">·</span> rest
          </span>
        </div>
      )}
    </div>
  )
}

function StatsRow({
  results,
  hitCount,
  missCount,
  streak,
  bestStreak
}: {
  results: TimingResult[]
  hitCount: number
  missCount: number
  streak: number
  bestStreak: number
}) {
  const { consistency, tendency } = useMemo(() => getTimingInsights(results), [results])

  return (
    <div className="flex flex-wrap gap-3">
      <StatCard label="Hits" value={String(hitCount)} color="text-emerald-400" />
      <StatCard
        label="Misses"
        value={String(missCount)}
        color={missCount > 0 ? 'text-red-400' : 'text-zinc-400'}
      />
      <StatCard
        label="Streak"
        value={`${streak}${bestStreak > streak ? ` (best: ${bestStreak})` : ''}`}
        color={streak > 0 ? 'text-emerald-400' : 'text-zinc-400'}
      />
      {consistency !== null && (
        <StatCard
          label="Consistency"
          value={`${consistency}ms`}
          color={
            consistency < 15
              ? 'text-emerald-400'
              : consistency < 30
                ? 'text-yellow-400'
                : 'text-red-400'
          }
        />
      )}
      {tendency !== null && (
        <StatCard
          label="Tendency"
          value={tendencyLabel(tendency)}
          color={
            Math.abs(tendency) < 5
              ? 'text-emerald-400'
              : Math.abs(tendency) < 15
                ? 'text-yellow-400'
                : 'text-red-400'
          }
        />
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
      <span className="mr-2 text-xs text-zinc-500">{label}</span>
      <span className={`font-mono text-sm font-medium ${color}`}>{value}</span>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-medium text-white">{value}</div>
    </div>
  )
}

function SensitivityCard({
  sensitivity,
  setSensitivity
}: {
  sensitivity: Sensitivity
  setSensitivity: (value: Sensitivity) => void
}): JSX.Element {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Sensitivity</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(['low', 'mid', 'high'] as Sensitivity[]).map((level) => (
          <button
            key={level}
            onClick={() => setSensitivity(level)}
            className={`rounded-xl px-3 py-2 text-sm font-medium capitalize transition-colors ${
              sensitivity === level
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  )
}

export function RhythmPanel(): JSX.Element {
  const {
    selectedPatternIndex,
    isRunning,
    sensitivity,
    results,
    accuracy,
    currentSubdivision,
    hitCount,
    missCount,
    streak,
    bestStreak,
    lastHitGrade,
    lastHitTime,
    reset,
    setPatternIndex,
    setSensitivity
  } = useRhythmStore()
  const { bpm, setBpm } = useMetronomeStore()
  const { tap } = useMetronome()
  const { start, stop, isConnected } = useRhythmTrainer()
  const lessonStep = useLessonStep('rhythm-trainer')
  const recordSession = useLearnProgressStore((state) => state.recordSession)
  const savedSummary = useLearnProgressStore(
    (state) => state.progress['rhythm-trainer']?.lastSession
  )
  const sessionStartedAt = useRef<number | null>(null)

  const pattern = RHYTHM_PATTERNS[selectedPatternIndex]
  const timing = useMemo(() => getTimingInsights(results), [results])

  useEffect(() => {
    if (!lessonStep || lessonStep.prefill.module !== 'rhythm-trainer') return
    setPatternIndex(getPatternIndexByName(lessonStep.prefill.patternName))
    if (lessonStep.prefill.bpm) setBpm(lessonStep.prefill.bpm)
    if (lessonStep.prefill.sensitivity) setSensitivity(lessonStep.prefill.sensitivity)
  }, [lessonStep, setBpm, setPatternIndex, setSensitivity])

  const buildSummary = useCallback(() => {
    const weakSpots: string[] = []
    if (missCount > 0) weakSpots.push(`${missCount} misses`)
    if (timing.tendency !== null && Math.abs(timing.tendency) >= 5) {
      weakSpots.push(tendencyLabel(timing.tendency))
    }
    const completionState: CompletionState =
      accuracy !== null && accuracy >= 75
        ? 'completed'
        : results.length > 0
          ? 'in-progress'
          : 'not-started'

    return {
      module: 'rhythm-trainer' as const,
      title: `${pattern.name} rhythm session`,
      description: `Logged ${hitCount} hits and ${missCount} misses while tracking timing drift.`,
      route: '/learn/rhythm',
      score: accuracy,
      bestStreak,
      completionState,
      weakSpots,
      patternName: pattern.name,
      accuracy,
      hitCount,
      missCount,
      tendencyLabel: tendencyLabel(timing.tendency)
    }
  }, [accuracy, bestStreak, hitCount, missCount, pattern.name, results.length, timing.tendency])

  const finalizeSession = useCallback(() => {
    if (sessionStartedAt.current === null && results.length === 0) return
    recordSession(buildSummary(), lessonStep?.id)
    sessionStartedAt.current = null
  }, [buildSummary, lessonStep?.id, recordSession, results.length])

  const handlePatternChange = (index: number) => {
    if (isRunning) {
      finalizeSession()
      stop()
      sessionStartedAt.current = null
    }
    setPatternIndex(index)
  }

  useEffect(() => {
    return () => {
      finalizeSession()
    }
  }, [finalizeSession])

  const displayedSummary =
    results.length > 0
      ? buildSummary()
      : savedSummary?.module === 'rhythm-trainer'
        ? savedSummary
        : null

  if (!isConnected) {
    return <AudioRequiredState featureName="Rhythm training" />
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <PageHeader
        title="Rhythm Trainer"
        description="Use the same tempo model as the metronome, choose a pattern, and track how early or late each attack lands."
        backTo="/learn"
        actions={
          <button
            onClick={() => {
              finalizeSession()
              if (isRunning) stop()
              reset()
              sessionStartedAt.current = null
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <RotateCcw size={14} />
            Reset Session
          </button>
        }
      />

      {lessonStep && (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          Guided step: <span className="font-medium text-white">{lessonStep.title}</span>.{' '}
          {lessonStep.description}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Pattern" value={pattern.name} />
        <SummaryCard
          label="Accuracy"
          value={accuracy === null ? 'Waiting for hits' : `${Math.round(accuracy)}%`}
        />
        <SensitivityCard sensitivity={sensitivity} setSensitivity={setSensitivity} />
        <SummaryCard
          label="Best streak"
          value={bestStreak > 0 ? String(bestStreak) : 'No streak yet'}
        />
      </div>

      <BpmControl bpm={bpm} setBpm={setBpm} onTap={tap} min={40} max={200} />

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-white">Patterns</div>
            <div className="mt-1 text-sm text-zinc-400">
              Pick a groove, then widen the window to see more presets side by side.
            </div>
          </div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            {RHYTHM_PATTERNS.length} patterns
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {RHYTHM_PATTERNS.map((patternOption, index) => (
            <button
              key={patternOption.name}
              onClick={() => handlePatternChange(index)}
              className={`flex min-h-[104px] flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition-colors ${
                selectedPatternIndex === index
                  ? 'border-emerald-400/60 bg-emerald-600 text-white'
                  : 'border-zinc-800 bg-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium leading-5">{patternOption.name}</span>
                <DifficultyDots level={patternOption.difficulty} />
              </div>
              <span className="text-xs leading-5 opacity-75">{patternOption.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <HitFeedback grade={lastHitGrade} time={lastHitTime} />
        <BeatGrid pattern={pattern} isRunning={isRunning} currentSubdivision={currentSubdivision} />
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={
              isRunning
                ? () => {
                    finalizeSession()
                    stop()
                    sessionStartedAt.current = null
                  }
                : () => {
                    sessionStartedAt.current = Date.now()
                    void start()
                  }
            }
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              isRunning
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isRunning ? 'Stop Trainer' : 'Start Trainer'}
          </button>
          <span className="text-sm text-zinc-400">
            {isRunning
              ? 'Play along with the highlighted rhythm blocks and watch the accuracy panel update.'
              : 'Choose a pattern, then start the trainer to begin tracking attacks.'}
          </span>
        </div>
      </div>

      {(hitCount > 0 || missCount > 0) && (
        <StatsRow
          results={results}
          hitCount={hitCount}
          missCount={missCount}
          streak={streak}
          bestStreak={bestStreak}
        />
      )}

      {results.length > 0 && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-zinc-400">Recent timing</span>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>early</span>
              <span>|</span>
              <span>late</span>
            </div>
          </div>
          <div className="flex h-20 items-center gap-1 overflow-x-auto">
            {results.slice(-30).map((result, index) => {
              if (result.type === 'miss') {
                return (
                  <div
                    key={index}
                    className="flex h-full w-3 flex-col items-center justify-center"
                    title="Miss"
                  >
                    <span className="text-xs font-bold text-red-500">X</span>
                  </div>
                )
              }

              const clamped = Math.max(-50, Math.min(50, result.deltaMs))
              const pct = Math.abs(clamped)
              const isEarly = clamped < 0
              const color =
                Math.abs(result.deltaMs) < 20
                  ? 'bg-emerald-500'
                  : Math.abs(result.deltaMs) < 40
                    ? 'bg-yellow-500'
                    : 'bg-red-500'

              return (
                <div
                  key={index}
                  className="flex h-full w-3 flex-col items-center"
                  title={`${result.deltaMs > 0 ? '+' : ''}${Math.round(result.deltaMs)}ms`}
                >
                  <div className="flex flex-1 items-end">
                    {isEarly && (
                      <div
                        className={`w-3 rounded-sm ${color}`}
                        style={{ height: `${pct + 8}%` }}
                      />
                    )}
                  </div>
                  <div className="h-px w-3 flex-shrink-0 bg-zinc-600" />
                  <div className="flex flex-1 items-start">
                    {!isEarly && (
                      <div
                        className={`w-3 rounded-sm ${color}`}
                        style={{ height: `${pct + 8}%` }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {displayedSummary?.module === 'rhythm-trainer' && (
        <LearnSessionSummary
          title={displayedSummary.title}
          description={displayedSummary.description}
          metrics={[
            {
              label: 'Accuracy',
              value:
                displayedSummary.accuracy === null
                  ? 'Waiting'
                  : `${Math.round(displayedSummary.accuracy)}%`,
              tone:
                (displayedSummary.accuracy ?? 0) >= 75
                  ? 'good'
                  : (displayedSummary.accuracy ?? 0) >= 55
                    ? 'warning'
                    : 'default'
            },
            {
              label: 'Hits / misses',
              value: `${displayedSummary.hitCount} / ${displayedSummary.missCount}`
            },
            {
              label: 'Tendency',
              value: displayedSummary.tendencyLabel,
              tone: displayedSummary.tendencyLabel === 'On time' ? 'good' : 'warning'
            },
            { label: 'Best streak', value: String(displayedSummary.bestStreak ?? '—') }
          ]}
          weakSpots={displayedSummary.weakSpots}
        />
      )}
    </div>
  )
}
