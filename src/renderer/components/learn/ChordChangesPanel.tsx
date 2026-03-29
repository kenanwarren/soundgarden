import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { CHORD_VOICINGS } from '../../utils/chord-voicings'
import {
  CHORD_CHANGE_PRESETS,
  buildRouteWithParams,
  getChordChangePreset,
  getChordIndexByName,
  getGenreDefinition,
  isChordChangePresetRecommendedForGenre
} from '../../utils/learn-data'
import { useLearnSession } from '../../hooks/useLearnSession'
import { useLessonStep } from '../../hooks/useLessonStep'
import { useMetronomeStore } from '../../stores/metronome-store'
import { useMetronome } from '../../hooks/useMetronome'
import { useChordDetection } from '../../hooks/useChordDetection'
import { useChordStore } from '../../stores/chord-store'
import { matchesChordVoicing } from '../../utils/learn-drills'
import { PageHeader } from '../layout/PageHeader'
import { AudioRequiredState } from '../common/AudioRequiredState'
import { BpmControl } from '../common/BpmControl'
import { ChordDiagram } from '../common/ChordDiagram'
import { LearnSessionSummary } from './LearnSessionSummary'
import type { CompletionState, GenreId } from '../../utils/learn-types'
import { GuidedStepBanner } from './GuidedStepBanner'
import { LearnStatCard } from './LearnStatCard'

interface ChordChangesState {
  presetId: string
  currentTargetIndex: number
  cleanSwitches: number
  mismatchCount: number
  mismatches: string[]
}

type ChordChangesAction =
  | { type: 'set-preset'; presetId: string }
  | { type: 'reset-session' }
  | { type: 'match'; targetCount: number }
  | { type: 'mismatch'; chordName: string }

const INITIAL_STATE: ChordChangesState = {
  presetId: 'open-two',
  currentTargetIndex: 0,
  cleanSwitches: 0,
  mismatchCount: 0,
  mismatches: []
}

function reducer(state: ChordChangesState, action: ChordChangesAction): ChordChangesState {
  switch (action.type) {
    case 'set-preset':
      return {
        ...INITIAL_STATE,
        presetId: action.presetId
      }
    case 'reset-session':
      return {
        ...state,
        currentTargetIndex: 0,
        cleanSwitches: 0,
        mismatchCount: 0,
        mismatches: []
      }
    case 'match':
      return {
        ...state,
        cleanSwitches: state.cleanSwitches + 1,
        currentTargetIndex: (state.currentTargetIndex + 1) % Math.max(action.targetCount, 1)
      }
    case 'mismatch':
      return {
        ...state,
        mismatchCount: state.mismatchCount + 1,
        mismatches: state.mismatches.includes(action.chordName)
          ? state.mismatches
          : [...state.mismatches, action.chordName].slice(0, 8)
      }
  }
}

export function ChordChangesPanel(): JSX.Element {
  const [searchParams] = useSearchParams()
  const lessonStep = useLessonStep('chord-changes')
  const sessionStartedAt = useRef<number | null>(null)
  const lastProcessedChord = useRef<string | null>(null)
  const appliedQueryKey = useRef<string | null>(null)
  const presetParam = searchParams.get('preset')
  const bpmParam = searchParams.get('bpm')
  const rawGenreContext = searchParams.get('genre')
  const genreContext =
    rawGenreContext && getGenreDefinition(rawGenreContext as GenreId)
      ? (rawGenreContext as GenreId)
      : null
  const genreLabel = genreContext ? (getGenreDefinition(genreContext)?.title ?? null) : null

  const [{ presetId, currentTargetIndex, cleanSwitches, mismatchCount, mismatches }, dispatch] =
    useReducer(reducer, INITIAL_STATE)
  const [isRunning, setIsRunning] = useState(false)

  const preset = getChordChangePreset(presetId) ?? getChordChangePreset('open-two')
  const targetVoicings = useMemo(
    () =>
      (preset?.chordNames ?? [])
        .map((name) => {
          const index = getChordIndexByName(name)
          return index === null ? null : CHORD_VOICINGS[index]
        })
        .filter((voicing): voicing is (typeof CHORD_VOICINGS)[number] => !!voicing),
    [preset]
  )
  const currentTarget = targetVoicings[currentTargetIndex] ?? null

  const { bpm, currentBeat, setBpm } = useMetronomeStore()
  const { tap, start: startMetronome, stop: stopMetronome } = useMetronome()
  const { start, stop, isConnected } = useChordDetection()
  const currentChord = useChordStore((state) => state.currentChord)

  function resetSessionState() {
    dispatch({ type: 'reset-session' })
    lastProcessedChord.current = null
  }

  useEffect(() => {
    if (!lessonStep || lessonStep.prefill.module !== 'chord-changes') return
    dispatch({ type: 'set-preset', presetId: lessonStep.prefill.presetId })
    if (lessonStep.prefill.bpm) setBpm(lessonStep.prefill.bpm)
    lastProcessedChord.current = null
  }, [lessonStep, setBpm])

  useEffect(() => {
    if (lessonStep) {
      appliedQueryKey.current = null
      return
    }

    const queryKey = `preset:${presetParam ?? ''}|bpm:${bpmParam ?? ''}`
    if (appliedQueryKey.current === queryKey) return
    if (!presetParam && !bpmParam) {
      appliedQueryKey.current = null
      return
    }

    if (presetParam && getChordChangePreset(presetParam)) {
      dispatch({ type: 'set-preset', presetId: presetParam })
    }

    if (bpmParam) {
      const bpmValue = Number(bpmParam)
      if (Number.isFinite(bpmValue)) setBpm(bpmValue)
    }

    lastProcessedChord.current = null
    sessionStartedAt.current = null
    appliedQueryKey.current = queryKey
  }, [bpmParam, lessonStep, presetParam, setBpm])

  function buildSummary() {
    const attempts = cleanSwitches + mismatchCount
    const score = attempts > 0 ? (cleanSwitches / attempts) * 100 : 0
    const completionState: CompletionState =
      cleanSwitches >= 4 ? 'completed' : attempts > 0 ? 'in-progress' : 'not-started'

    return {
      module: 'chord-changes' as const,
      title: `${preset?.name ?? 'Chord changes'} session`,
      description: `Completed ${cleanSwitches} clean target changes at ${bpm} BPM.`,
      route: '/learn/chord-changes',
      resumeHref: lessonStep
        ? buildRouteWithParams('/learn/chord-changes', { lesson: lessonStep.id })
        : buildRouteWithParams('/learn/chord-changes', {
            preset: preset?.id ?? presetId,
            bpm,
            genre: genreContext
          }),
      contextLabel: preset?.name ?? 'Chord changes',
      score,
      bestStreak: cleanSwitches,
      completionState,
      weakSpots: mismatches.slice(0, 4),
      presetId: preset?.id ?? presetId,
      presetName: preset?.name ?? 'Custom',
      cleanSwitches,
      mismatches,
      bpm
    }
  }

  const { savedSummary, finalizeSession, startSession, resetSessionStart } = useLearnSession({
    module: 'chord-changes',
    lessonStepId: lessonStep?.id,
    sessionKey: lessonStep
      ? null
      : `preset:${presetParam ?? ''}|bpm:${bpmParam ?? ''}|genre:${genreContext ?? ''}`,
    hasActivity: () => sessionStartedAt.current !== null || cleanSwitches > 0 || mismatchCount > 0,
    buildSummary,
    sessionStartedAtRef: sessionStartedAt
  })

  function stopSession() {
    finalizeSession()
    stop()
    stopMetronome()
    setIsRunning(false)
    resetSessionStart()
  }

  useEffect(() => {
    if (!isRunning || !currentChord || !currentTarget) return
    if (currentChord.name === lastProcessedChord.current) return

    lastProcessedChord.current = currentChord.name

    const inTargetSet = targetVoicings.some((target) => matchesChordVoicing(target, currentChord))
    if (matchesChordVoicing(currentTarget, currentChord)) {
      dispatch({ type: 'match', targetCount: targetVoicings.length })
      return
    }

    if (!inTargetSet || currentChord.name !== currentTarget.name) {
      dispatch({ type: 'mismatch', chordName: currentChord.name })
    }
  }, [currentChord, currentTarget, isRunning, targetVoicings])

  const displayedSummary =
    cleanSwitches + mismatchCount > 0
      ? buildSummary()
      : savedSummary?.module === 'chord-changes'
        ? savedSummary
        : null

  if (!isConnected) {
    return <AudioRequiredState featureName="Chord changes training" />
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <PageHeader
        title="Chord Changes Trainer"
        description="Keep the metronome running, hit the highlighted chord cleanly, and only advance once Soundgarden hears the correct target."
        backTo="/learn"
        actions={
          <button
            onClick={() => {
              stop()
              stopMetronome()
              setIsRunning(false)
              finalizeSession()
              resetSessionStart()
              resetSessionState()
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <RotateCcw size={14} />
            Reset Session
          </button>
        }
      />

      {lessonStep && (
        <GuidedStepBanner title={lessonStep.title} description={lessonStep.description} />
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <LearnStatCard label="Preset" value={preset?.name ?? 'Unknown'} />
        <LearnStatCard label="Next chord" value={currentTarget?.name ?? 'Pick a preset'} />
        <LearnStatCard label="Clean switches" value={String(cleanSwitches)} />
        <LearnStatCard label="Beat" value={String(currentBeat + 1)} />
      </div>

      <BpmControl bpm={bpm} setBpm={setBpm} onTap={tap} min={50} max={180} />

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
        <div className="text-sm font-medium text-white">Progression preset</div>
        {genreLabel && !lessonStep && (
          <div className="mt-2 text-sm text-emerald-200">
            Highlighting presets tagged for {genreLabel.toLowerCase()} practice.
          </div>
        )}
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {CHORD_CHANGE_PRESETS.map((option) => {
            return (
              <button
                key={option.id}
                onClick={() => {
                  dispatch({ type: 'set-preset', presetId: option.id })
                  resetSessionState()
                }}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  presetId === option.id
                    ? 'border-emerald-400/60 bg-emerald-600 text-white'
                    : isChordChangePresetRecommendedForGenre(option.id, genreContext)
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-zinc-100 hover:border-emerald-500/50'
                      : 'border-zinc-800 bg-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                <div className="text-sm font-medium">{option.name}</div>
                <div className="mt-1 text-xs opacity-75">{option.description}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {option.chordNames.map((name, index) => (
                    <span
                      key={`${option.id}-${name}-${index}`}
                      className="rounded-full bg-black/20 px-2 py-1 text-xs"
                    >
                      {name}
                    </span>
                  ))}
                </div>
                {option.toneSuggestions?.length ? (
                  <div className="mt-3 text-xs opacity-80">Tone: {option.toneSuggestions[0]}</div>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="text-sm font-medium text-white">Target order</div>
          <div className="mt-4 flex flex-wrap gap-3">
            {targetVoicings.map((voicing, index) => (
              <div
                key={`${voicing.name}-${index}`}
                className={`rounded-2xl border p-3 ${
                  index === currentTargetIndex
                    ? 'border-emerald-400 bg-emerald-600/20'
                    : 'border-zinc-800 bg-zinc-950/70'
                }`}
              >
                <ChordDiagram voicing={voicing} size="sm" />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (isRunning) {
                  stopSession()
                  return
                }
                resetSessionState()
                startSession()
                setIsRunning(true)
                start()
                void startMetronome()
              }}
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
                ? currentTarget
                  ? `Play ${currentTarget.name} cleanly to advance.`
                  : 'Waiting for a target preset.'
                : 'Start the trainer to run the metronome and wait for the first target chord.'}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="text-sm font-medium text-white">Detection</div>
          <div className="mt-3 text-4xl font-semibold text-white">{currentChord?.name ?? '—'}</div>
          <p className="mt-2 text-sm text-zinc-400">
            {currentChord
              ? matchesChordVoicing(currentTarget ?? { root: '', quality: '' }, currentChord)
                ? 'Correct target detected. Move to the next chord.'
                : 'Detected chord is outside the current target.'
              : 'Strum the highlighted chord and let it settle.'}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Current target
              </div>
              <div className="mt-2 text-lg font-medium text-white">
                {currentTarget?.name ?? '—'}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Mismatches</div>
              <div className="mt-2 text-lg font-medium text-white">{mismatchCount}</div>
            </div>
          </div>
        </div>
      </div>

      {displayedSummary?.module === 'chord-changes' && (
        <LearnSessionSummary
          title={displayedSummary.title}
          description={displayedSummary.description}
          metrics={[
            {
              label: 'Clean switches',
              value: String(displayedSummary.cleanSwitches),
              tone: displayedSummary.cleanSwitches >= 4 ? 'good' : 'default'
            },
            {
              label: 'Preset',
              value: displayedSummary.presetName
            },
            {
              label: 'Score',
              value: `${Math.round(displayedSummary.score ?? 0)}%`,
              tone:
                (displayedSummary.score ?? 0) >= 80
                  ? 'good'
                  : (displayedSummary.score ?? 0) >= 50
                    ? 'warning'
                    : 'default'
            },
            { label: 'Tempo', value: `${displayedSummary.bpm} BPM` }
          ]}
          weakSpots={displayedSummary.weakSpots}
        />
      )}
    </div>
  )
}
