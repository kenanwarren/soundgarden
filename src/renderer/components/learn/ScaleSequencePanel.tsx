import { useEffect, useMemo, useReducer, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { NOTE_NAMES } from '../../utils/constants'
import { SCALES, getScaleNotes } from '../../utils/scale-data'
import { getScalePositions } from '../../utils/fretboard-data'
import { usePitchDetection } from '../../hooks/usePitchDetection'
import { useLearnSession } from '../../hooks/useLearnSession'
import { PageHeader } from '../layout/PageHeader'
import { Fretboard } from '../common/Fretboard'
import { AudioRequiredState } from '../common/AudioRequiredState'
import { useLessonStep } from '../../hooks/useLessonStep'
import {
  SCALE_SEQUENCE_PRESETS,
  buildRouteWithParams,
  getGenreDefinition,
  getScaleIndexByName,
  getScaleSequencePreset,
  isScaleSequencePresetRecommendedForGenre
} from '../../utils/learn-data'
import { LearnSessionSummary } from './LearnSessionSummary'
import { buildScaleSequence, type ScaleSequenceType } from '../../utils/learn-drills'
import type { CompletionState, GenreId } from '../../utils/learn-types'
import { GuidedStepBanner } from './GuidedStepBanner'
import { LearnStatCard } from './LearnStatCard'

interface ScaleSequenceState {
  selectedPresetId: string | null
  root: string
  scaleIndex: number
  sequenceType: ScaleSequenceType
  targetLoops: number
  isPracticing: boolean
  currentIndex: number
  loopsCompleted: number
  currentRun: number
  bestRun: number
  missedNotes: string[]
  detectedNote: string | null
  detectedOctave: number | null
}

type ScaleSequenceAction =
  | { type: 'apply-preset'; presetId: string }
  | {
      type: 'apply-custom-config'
      root: string
      scaleIndex: number
      sequenceType: ScaleSequenceType
      targetLoops: number
    }
  | { type: 'set-root'; root: string }
  | { type: 'set-scale-index'; scaleIndex: number }
  | { type: 'set-sequence-type'; sequenceType: ScaleSequenceType }
  | { type: 'set-target-loops'; targetLoops: number }
  | { type: 'reset-session' }
  | { type: 'start-practice' }
  | { type: 'stop-practice' }
  | { type: 'clear-detected-note' }
  | { type: 'set-detected-note'; note: string; octave: number }
  | { type: 'match-note'; sequenceLength: number }
  | { type: 'miss-note'; expectedNote: string }

const INITIAL_STATE: ScaleSequenceState = {
  selectedPresetId: null,
  root: 'A',
  scaleIndex: getScaleIndexByName('Minor Pentatonic'),
  sequenceType: 'ascending',
  targetLoops: 2,
  isPracticing: false,
  currentIndex: 0,
  loopsCompleted: 0,
  currentRun: 0,
  bestRun: 0,
  missedNotes: [],
  detectedNote: null,
  detectedOctave: null
}

function resetSessionState(state: ScaleSequenceState): ScaleSequenceState {
  return {
    ...state,
    currentIndex: 0,
    loopsCompleted: 0,
    currentRun: 0,
    bestRun: 0,
    missedNotes: [],
    detectedNote: null,
    detectedOctave: null
  }
}

function reducer(state: ScaleSequenceState, action: ScaleSequenceAction): ScaleSequenceState {
  switch (action.type) {
    case 'apply-preset': {
      const preset = getScaleSequencePreset(action.presetId)
      if (!preset) return state
      return resetSessionState({
        ...state,
        selectedPresetId: preset.id,
        root: preset.root,
        scaleIndex: getScaleIndexByName(preset.scaleName),
        sequenceType: preset.sequenceType,
        targetLoops: preset.loops
      })
    }
    case 'apply-custom-config':
      return resetSessionState({
        ...state,
        selectedPresetId: null,
        root: action.root,
        scaleIndex: action.scaleIndex,
        sequenceType: action.sequenceType,
        targetLoops: action.targetLoops
      })
    case 'set-root':
      return {
        ...state,
        selectedPresetId: null,
        root: action.root
      }
    case 'set-scale-index':
      return {
        ...state,
        selectedPresetId: null,
        scaleIndex: action.scaleIndex
      }
    case 'set-sequence-type':
      return {
        ...state,
        selectedPresetId: null,
        sequenceType: action.sequenceType
      }
    case 'set-target-loops':
      return {
        ...state,
        selectedPresetId: null,
        targetLoops: action.targetLoops
      }
    case 'reset-session':
      return resetSessionState(state)
    case 'start-practice':
      return {
        ...resetSessionState(state),
        isPracticing: true
      }
    case 'stop-practice':
      return {
        ...state,
        isPracticing: false
      }
    case 'clear-detected-note':
      return {
        ...state,
        detectedNote: null,
        detectedOctave: null
      }
    case 'set-detected-note':
      return {
        ...state,
        detectedNote: action.note,
        detectedOctave: action.octave
      }
    case 'match-note': {
      const nextRun = state.currentRun + 1
      const nextIndex = state.currentIndex + 1
      const completedLoop = nextIndex >= action.sequenceLength
      return {
        ...state,
        currentRun: nextRun,
        bestRun: Math.max(state.bestRun, nextRun),
        currentIndex: completedLoop ? 0 : nextIndex,
        loopsCompleted: completedLoop ? state.loopsCompleted + 1 : state.loopsCompleted
      }
    }
    case 'miss-note':
      return {
        ...state,
        currentRun: 0,
        missedNotes: state.missedNotes.includes(action.expectedNote)
          ? state.missedNotes
          : [...state.missedNotes, action.expectedNote].slice(0, 8)
      }
  }
}

export function ScaleSequencePanel(): JSX.Element {
  const [searchParams] = useSearchParams()
  const lessonStep = useLessonStep('scale-sequences')
  const sessionStartedAt = useRef<number | null>(null)
  const lastAcceptedAt = useRef(0)
  const lastMissedAt = useRef(0)
  const appliedQueryKey = useRef<string | null>(null)
  const presetParam = searchParams.get('preset')
  const rootParam = searchParams.get('root')
  const scaleParam = searchParams.get('scale')
  const sequenceParam = searchParams.get('sequence')
  const loopsParam = searchParams.get('loops')
  const rawGenreContext = searchParams.get('genre')
  const genreContext =
    rawGenreContext && getGenreDefinition(rawGenreContext as GenreId)
      ? (rawGenreContext as GenreId)
      : null
  const genreLabel = genreContext ? (getGenreDefinition(genreContext)?.title ?? null) : null

  const [
    {
      selectedPresetId,
      root,
      scaleIndex,
      sequenceType,
      targetLoops,
      isPracticing,
      currentIndex,
      loopsCompleted,
      currentRun,
      bestRun,
      missedNotes,
      detectedNote,
      detectedOctave
    },
    dispatch
  ] = useReducer(reducer, INITIAL_STATE)

  const scale = SCALES[scaleIndex]
  const selectedPreset = getScaleSequencePreset(selectedPresetId)
  const scaleNotes = getScaleNotes(root, scale)
  const sequence = useMemo(
    () => buildScaleSequence(scaleNotes, sequenceType),
    [scaleNotes, sequenceType]
  )
  const positions = useMemo(() => getScalePositions(scaleNotes), [scaleNotes])
  const expectedNote = sequence[currentIndex] ?? null
  const activeNote =
    detectedNote && detectedOctave !== null ? { note: detectedNote, octave: detectedOctave } : null

  function resetSessionState() {
    dispatch({ type: 'reset-session' })
    lastAcceptedAt.current = 0
    lastMissedAt.current = 0
  }

  function applySequencePreset(presetId: string) {
    dispatch({ type: 'apply-preset', presetId })
    resetSessionState()
  }

  useEffect(() => {
    if (!lessonStep || lessonStep.prefill.module !== 'scale-sequences') return
    if (lessonStep.prefill.presetId) {
      dispatch({ type: 'apply-preset', presetId: lessonStep.prefill.presetId })
      lastAcceptedAt.current = 0
      lastMissedAt.current = 0
      return
    }
    dispatch({
      type: 'apply-custom-config',
      root: lessonStep.prefill.root,
      scaleIndex: getScaleIndexByName(lessonStep.prefill.scaleName),
      sequenceType: lessonStep.prefill.sequenceType,
      targetLoops: lessonStep.prefill.loops ?? 2
    })
    lastAcceptedAt.current = 0
    lastMissedAt.current = 0
  }, [lessonStep])

  useEffect(() => {
    if (lessonStep) {
      appliedQueryKey.current = null
      return
    }

    const queryKey = `preset:${presetParam ?? ''}|root:${rootParam ?? ''}|scale:${scaleParam ?? ''}|sequence:${sequenceParam ?? ''}|loops:${loopsParam ?? ''}`
    if (appliedQueryKey.current === queryKey) return
    if (!presetParam && !rootParam && !scaleParam && !sequenceParam && !loopsParam) {
      appliedQueryKey.current = null
      return
    }

    if (presetParam && getScaleSequencePreset(presetParam)) {
      dispatch({ type: 'apply-preset', presetId: presetParam })
    } else {
      dispatch({
        type: 'apply-custom-config',
        root: rootParam ?? root,
        scaleIndex: getScaleIndexByName(scaleParam ?? scale.name),
        sequenceType:
          sequenceParam === 'descending' || sequenceParam === 'thirds'
            ? sequenceParam
            : 'ascending',
        targetLoops: Math.max(1, Number(loopsParam) || targetLoops)
      })
    }

    lastAcceptedAt.current = 0
    lastMissedAt.current = 0
    appliedQueryKey.current = queryKey
  }, [
    genreContext,
    lessonStep,
    loopsParam,
    presetParam,
    root,
    rootParam,
    scale.name,
    scaleParam,
    sequenceParam,
    targetLoops
  ])

  const progressSteps = loopsCompleted * sequence.length + currentIndex
  const totalSteps = Math.max(1, targetLoops * Math.max(sequence.length, 1))
  const score = Math.min(100, Math.round((progressSteps / totalSteps) * 100))

  function buildSummary() {
    const completionState: CompletionState =
      loopsCompleted >= targetLoops
        ? 'completed'
        : progressSteps > 0
          ? 'in-progress'
          : 'not-started'

    return {
      module: 'scale-sequences' as const,
      title: `${root} ${scale.name} ${sequenceType} sequence`,
      description: `Completed ${loopsCompleted} of ${targetLoops} target loops while tracking note order.`,
      route: '/learn/scale-sequences',
      resumeHref: lessonStep
        ? buildRouteWithParams('/learn/scale-sequences', { lesson: lessonStep.id })
        : buildRouteWithParams('/learn/scale-sequences', {
            preset: selectedPresetId,
            root,
            scale: scale.name,
            sequence: sequenceType,
            loops: targetLoops,
            genre: genreContext
          }),
      contextLabel: selectedPreset?.name ?? `${root} ${scale.name} ${sequenceType}`,
      score,
      bestStreak: bestRun,
      completionState,
      weakSpots: missedNotes.slice(0, 4),
      root,
      scaleName: scale.name,
      sequenceType,
      loopsCompleted,
      targetLoops,
      missedNotes
    }
  }

  const { savedSummary, finalizeSession, startSession, resetSessionStart } = useLearnSession({
    module: 'scale-sequences',
    lessonStepId: lessonStep?.id,
    sessionKey: lessonStep
      ? null
      : `preset:${presetParam ?? ''}|root:${rootParam ?? ''}|scale:${scaleParam ?? ''}|sequence:${sequenceParam ?? ''}|loops:${loopsParam ?? ''}|genre:${genreContext ?? ''}`,
    hasActivity: () => sessionStartedAt.current !== null || progressSteps > 0,
    buildSummary,
    sessionStartedAtRef: sessionStartedAt
  })

  function onPitch(data: {
    note: string
    octave: number
    frequency: number
    clarity: number
    cents: number
  }) {
    if (data.frequency === 0) {
      dispatch({ type: 'clear-detected-note' })
      return
    }

    dispatch({ type: 'set-detected-note', note: data.note, octave: data.octave })

    if (!isPracticing || !expectedNote || Math.abs(data.cents) > 30) return

    const now = Date.now()
    if (data.note === expectedNote) {
      if (now - lastAcceptedAt.current < 250) return
      lastAcceptedAt.current = now
      dispatch({ type: 'match-note', sequenceLength: sequence.length })
      return
    }

    if (now - lastMissedAt.current < 400) return
    lastMissedAt.current = now
    dispatch({ type: 'miss-note', expectedNote })
  }

  const { start, stop, isConnected } = usePitchDetection({
    id: '__scale_sequence__',
    onPitch
  })

  function stopPractice() {
    finalizeSession()
    stop()
    dispatch({ type: 'stop-practice' })
    resetSessionStart()
  }

  useEffect(() => {
    if (isPracticing && loopsCompleted >= targetLoops && targetLoops > 0) {
      finalizeSession()
      stop()
      dispatch({ type: 'stop-practice' })
      resetSessionStart()
    }
  }, [finalizeSession, isPracticing, loopsCompleted, resetSessionStart, stop, targetLoops])

  const displayedSummary =
    progressSteps > 0
      ? buildSummary()
      : savedSummary?.module === 'scale-sequences'
        ? savedSummary
        : null

  if (!isConnected) {
    return <AudioRequiredState featureName="Scale sequence training" />
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <PageHeader
        title="Scale Sequence Trainer"
        description="Move beyond note coverage by playing scale tones in a strict order, then repeat the sequence for multiple loops."
        backTo="/learn"
        actions={
          <button
            onClick={() => {
              stop()
              finalizeSession()
              resetSessionStart()
              dispatch({ type: 'stop-practice' })
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
        <LearnStatCard label="Scale" value={`${root} ${scale.name}`} />
        <LearnStatCard label="Sequence" value={selectedPreset?.name ?? sequenceType} />
        <LearnStatCard label="Loops" value={`${loopsCompleted}/${targetLoops}`} />
        <LearnStatCard label="Next note" value={expectedNote ?? 'Ready'} />
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
        <div className="text-sm font-medium text-white">Sequence presets</div>
        <p className="mt-1 text-sm text-zinc-400">
          Genre-ready presets keep the sequence settings coherent, but you can still edit them
          manually.
        </p>
        {genreLabel && !lessonStep && (
          <p className="mt-2 text-sm text-emerald-200">
            Highlighting presets tagged for {genreLabel.toLowerCase()} practice.
          </p>
        )}
        <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {SCALE_SEQUENCE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applySequencePreset(preset.id)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                selectedPresetId === preset.id
                  ? 'border-emerald-400/60 bg-emerald-600 text-white'
                  : isScaleSequencePresetRecommendedForGenre(preset.id, genreContext)
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-zinc-100 hover:border-emerald-500/50'
                    : 'border-zinc-800 bg-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              <div className="text-sm font-medium">{preset.name}</div>
              <div className="mt-1 text-xs opacity-75">{preset.description}</div>
              <div className="mt-3 text-xs opacity-80">
                {preset.root} {preset.scaleName} · {preset.sequenceType} · {preset.loops} loops
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
            <div className="text-sm font-medium text-white">Root note</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {NOTE_NAMES.map((note) => (
                <button
                  key={note}
                  onClick={() => {
                    dispatch({ type: 'set-root', root: note })
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    root === note
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
            <div className="text-sm font-medium text-white">Scale type</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SCALES.map((definition, index) => (
                <button
                  key={definition.name}
                  onClick={() => {
                    dispatch({ type: 'set-scale-index', scaleIndex: index })
                  }}
                  className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                    scaleIndex === index
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {definition.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
            <div className="text-sm font-medium text-white">Sequence type</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['ascending', 'descending', 'thirds'] as ScaleSequenceType[]).map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    dispatch({ type: 'set-sequence-type', sequenceType: option })
                  }}
                  className={`rounded-xl px-3 py-2 text-sm capitalize transition-colors ${
                    sequenceType === option
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-xl">
            <Fretboard highlightedPositions={positions} activeNote={activeNote} rootNote={root} />
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
            <div className="text-sm font-medium text-white">Required order</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {sequence.map((note, index) => (
                <span
                  key={`${note}-${index}`}
                  className={`rounded-full px-3 py-1 text-sm font-mono ${
                    index < currentIndex || loopsCompleted > 0
                      ? 'bg-emerald-600 text-white'
                      : index === currentIndex
                        ? 'bg-yellow-500 text-black'
                        : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {note}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (isPracticing) {
                    stopPractice()
                    return
                  }
                  startSession()
                  dispatch({ type: 'start-practice' })
                  lastAcceptedAt.current = 0
                  lastMissedAt.current = 0
                  void start()
                }}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  isPracticing
                    ? 'bg-rose-600 text-white hover:bg-rose-500'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {isPracticing ? 'Stop Practice' : 'Start Practice'}
              </button>
              <label className="text-sm text-zinc-400">
                Target loops
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={targetLoops}
                  onChange={(event) => {
                    dispatch({
                      type: 'set-target-loops',
                      targetLoops: Math.max(1, Number(event.target.value) || 1)
                    })
                  }}
                  className="ml-3 w-16 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-center text-white outline-none"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {displayedSummary?.module === 'scale-sequences' && (
        <LearnSessionSummary
          title={displayedSummary.title}
          description={displayedSummary.description}
          metrics={[
            {
              label: 'Loops',
              value: `${displayedSummary.loopsCompleted}/${displayedSummary.targetLoops}`,
              tone:
                displayedSummary.loopsCompleted >= displayedSummary.targetLoops ? 'good' : 'default'
            },
            { label: 'Sequence', value: displayedSummary.sequenceType },
            {
              label: 'Score',
              value: `${Math.round(displayedSummary.score ?? 0)}%`,
              tone:
                (displayedSummary.score ?? 0) >= 100
                  ? 'good'
                  : (displayedSummary.score ?? 0) >= 60
                    ? 'warning'
                    : 'default'
            },
            { label: 'Best run', value: String(displayedSummary.bestStreak ?? '—') }
          ]}
          weakSpots={displayedSummary.weakSpots}
        />
      )}
    </div>
  )
}
