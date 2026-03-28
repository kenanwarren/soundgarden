import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { NOTE_NAMES } from '../../utils/constants'
import { SCALES, getScaleNotes } from '../../utils/scale-data'
import { getScalePositions } from '../../utils/fretboard-data'
import { usePitchDetection } from '../../hooks/usePitchDetection'
import { PageHeader } from '../layout/PageHeader'
import { Fretboard } from '../common/Fretboard'
import { AudioRequiredState } from '../common/AudioRequiredState'
import { useLessonStep } from '../../hooks/useLessonStep'
import { getScaleIndexByName } from '../../utils/learn-data'
import { useLearnProgressStore } from '../../stores/learn-progress-store'
import { LearnSessionSummary } from './LearnSessionSummary'
import { buildScaleSequence, type ScaleSequenceType } from '../../utils/learn-drills'

function SummaryCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-medium text-white">{value}</div>
    </div>
  )
}

export function ScaleSequencePanel(): JSX.Element {
  const lessonStep = useLessonStep('scale-sequences')
  const recordSession = useLearnProgressStore((state) => state.recordSession)
  const savedSummary = useLearnProgressStore((state) => state.progress['scale-sequences']?.lastSession)
  const sessionStartedAt = useRef<number | null>(null)
  const lastAcceptedAt = useRef(0)
  const lastMissedAt = useRef(0)

  const [root, setRoot] = useState('A')
  const [scaleIndex, setScaleIndex] = useState(getScaleIndexByName('Minor Pentatonic'))
  const [sequenceType, setSequenceType] = useState<ScaleSequenceType>('ascending')
  const [targetLoops, setTargetLoops] = useState(2)
  const [isPracticing, setIsPracticing] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loopsCompleted, setLoopsCompleted] = useState(0)
  const [currentRun, setCurrentRun] = useState(0)
  const [bestRun, setBestRun] = useState(0)
  const [missedNotes, setMissedNotes] = useState<string[]>([])
  const [detectedNote, setDetectedNote] = useState<string | null>(null)
  const [detectedOctave, setDetectedOctave] = useState<number | null>(null)

  const scale = SCALES[scaleIndex]
  const scaleNotes = getScaleNotes(root, scale)
  const sequence = useMemo(
    () => buildScaleSequence(scaleNotes, sequenceType),
    [scaleNotes, sequenceType]
  )
  const positions = useMemo(() => getScalePositions(scaleNotes), [scaleNotes])
  const expectedNote = sequence[currentIndex] ?? null
  const activeNote =
    detectedNote && detectedOctave !== null ? { note: detectedNote, octave: detectedOctave } : null

  const resetSessionState = useCallback(() => {
    setCurrentIndex(0)
    setLoopsCompleted(0)
    setCurrentRun(0)
    setBestRun(0)
    setMissedNotes([])
    setDetectedNote(null)
    setDetectedOctave(null)
    lastAcceptedAt.current = 0
    lastMissedAt.current = 0
  }, [])

  useEffect(() => {
    if (!lessonStep || lessonStep.prefill.module !== 'scale-sequences') return
    setRoot(lessonStep.prefill.root)
    setScaleIndex(getScaleIndexByName(lessonStep.prefill.scaleName))
    setSequenceType(lessonStep.prefill.sequenceType)
    setTargetLoops(lessonStep.prefill.loops ?? 2)
    resetSessionState()
  }, [lessonStep, resetSessionState])

  const progressSteps = loopsCompleted * sequence.length + currentIndex
  const totalSteps = Math.max(1, targetLoops * Math.max(sequence.length, 1))
  const score = Math.min(100, Math.round((progressSteps / totalSteps) * 100))

  const buildSummary = useCallback(() => {
    return {
      module: 'scale-sequences' as const,
      title: `${root} ${scale.name} ${sequenceType} sequence`,
      description: `Completed ${loopsCompleted} of ${targetLoops} target loops while tracking note order.`,
      route: '/learn/scale-sequences',
      score,
      bestStreak: bestRun,
      completionState:
        loopsCompleted >= targetLoops ? 'completed' : progressSteps > 0 ? 'in-progress' : 'not-started',
      weakSpots: missedNotes.slice(0, 4),
      root,
      scaleName: scale.name,
      sequenceType,
      loopsCompleted,
      targetLoops,
      missedNotes
    }
  }, [bestRun, loopsCompleted, missedNotes, progressSteps, root, scale.name, score, sequenceType, targetLoops])

  const finalizeSession = useCallback(() => {
    if (sessionStartedAt.current === null && progressSteps === 0) return
    recordSession(buildSummary(), lessonStep?.id)
    sessionStartedAt.current = null
  }, [buildSummary, lessonStep?.id, progressSteps, recordSession])

  const stopPractice = useCallback(() => {
    finalizeSession()
    stop()
    setIsPracticing(false)
    sessionStartedAt.current = null
  }, [finalizeSession, stop])

  const onPitch = useCallback(
    (data: { note: string; octave: number; frequency: number; clarity: number; cents: number }) => {
      if (data.frequency === 0) {
        setDetectedNote(null)
        setDetectedOctave(null)
        return
      }

      setDetectedNote(data.note)
      setDetectedOctave(data.octave)

      if (!isPracticing || !expectedNote || Math.abs(data.cents) > 30) return

      const now = Date.now()
      if (data.note === expectedNote) {
        if (now - lastAcceptedAt.current < 250) return
        lastAcceptedAt.current = now
        setCurrentRun((run) => {
          const next = run + 1
          setBestRun((best) => Math.max(best, next))
          return next
        })
        setCurrentIndex((index) => {
          const next = index + 1
          if (next >= sequence.length) {
            setLoopsCompleted((loops) => loops + 1)
            return 0
          }
          return next
        })
        return
      }

      if (now - lastMissedAt.current < 400) return
      lastMissedAt.current = now
      setCurrentRun(0)
      setMissedNotes((current) =>
        current.includes(expectedNote) ? current : [...current, expectedNote].slice(0, 8)
      )
    },
    [expectedNote, isPracticing, sequence.length]
  )

  const { start, stop, isConnected } = usePitchDetection({
    id: '__scale_sequence__',
    onPitch
  })

  useEffect(() => {
    if (isPracticing && loopsCompleted >= targetLoops && targetLoops > 0) {
      stopPractice()
    }
  }, [isPracticing, loopsCompleted, stopPractice, targetLoops])

  useEffect(() => {
    return () => {
      finalizeSession()
    }
  }, [finalizeSession])

  const displayedSummary =
    progressSteps > 0 ? buildSummary() : savedSummary?.module === 'scale-sequences' ? savedSummary : null

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
              setIsPracticing(false)
              finalizeSession()
              sessionStartedAt.current = null
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
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          Guided step: <span className="font-medium text-white">{lessonStep.title}</span>.{' '}
          {lessonStep.description}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Scale" value={`${root} ${scale.name}`} />
        <SummaryCard label="Sequence" value={sequenceType} />
        <SummaryCard label="Loops" value={`${loopsCompleted}/${targetLoops}`} />
        <SummaryCard label="Next note" value={expectedNote ?? 'Ready'} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
            <div className="text-sm font-medium text-white">Root note</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {NOTE_NAMES.map((note) => (
                <button
                  key={note}
                  onClick={() => setRoot(note)}
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
                  onClick={() => setScaleIndex(index)}
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
                  onClick={() => setSequenceType(option)}
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
                  resetSessionState()
                  sessionStartedAt.current = Date.now()
                  setIsPracticing(true)
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
                  onChange={(event) => setTargetLoops(Math.max(1, Number(event.target.value) || 1))}
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
