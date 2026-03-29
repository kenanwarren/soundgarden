import { useCallback, useEffect, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import { NOTE_NAMES } from '../../utils/constants'
import { SCALES, getScaleNotes } from '../../utils/scale-data'
import { getScalePositions } from '../../utils/fretboard-data'
import { useScaleStore } from '../../stores/scale-store'
import { useScalePractice } from '../../hooks/useScalePractice'
import { useLearnSession } from '../../hooks/useLearnSession'
import { Fretboard } from '../common/Fretboard'
import { useLearnToolRouteState } from '../../hooks/useLearnToolRouteState'
import { getScaleIndexByName } from '../../utils/learn-data'
import { LearnSessionSummary } from './LearnSessionSummary'
import type { CompletionState } from '../../utils/learn-types'
import { LearnStatCard } from './LearnStatCard'
import { LearnToolLayout } from './LearnToolLayout'

export function ScalePanel(): JSX.Element {
  const {
    selectedRoot,
    selectedScaleIndex,
    hitNotes,
    currentDetectedNote,
    currentDetectedOctave,
    setRoot,
    setScaleIndex,
    resetProgress
  } = useScaleStore()
  const { startPractice, stopPractice, isPracticing, isConnected } = useScalePractice()
  const { searchParams, lessonStep, buildResumeHref } = useLearnToolRouteState(
    'scale-explorer',
    '/learn/scales'
  )
  const sessionStartedAt = useRef<number | null>(null)
  const rootParam = searchParams.get('root')
  const scaleParam = searchParams.get('scale')

  const scale = SCALES[selectedScaleIndex]
  const scaleNotes = getScaleNotes(selectedRoot, scale)
  const positions = getScalePositions(scaleNotes)

  const activeNote =
    currentDetectedNote && currentDetectedOctave !== null
      ? { note: currentDetectedNote, octave: currentDetectedOctave }
      : null

  useEffect(() => {
    if (!lessonStep || lessonStep.prefill.module !== 'scale-explorer') return
    setRoot(lessonStep.prefill.root)
    setScaleIndex(getScaleIndexByName(lessonStep.prefill.scaleName))
    sessionStartedAt.current = null
    resetProgress()
  }, [lessonStep, resetProgress, setRoot, setScaleIndex])

  useEffect(() => {
    if (lessonStep) return
    if (!rootParam && !scaleParam) return
    if (rootParam) setRoot(rootParam)
    if (scaleParam) setScaleIndex(getScaleIndexByName(scaleParam))
    sessionStartedAt.current = null
    resetProgress()
  }, [lessonStep, resetProgress, rootParam, scaleParam, setRoot, setScaleIndex])

  const buildSummary = useCallback(
    (timeSpentMs: number) => {
      const missedNotes = scaleNotes.filter((note) => !hitNotes.includes(note))
      const score = scaleNotes.length ? (hitNotes.length / scaleNotes.length) * 100 : 0
      const completionState: CompletionState =
        hitNotes.length === 0
          ? 'not-started'
          : hitNotes.length === scaleNotes.length
            ? 'completed'
            : 'in-progress'

      return {
        module: 'scale-explorer' as const,
        title: `${selectedRoot} ${scale.name} session`,
        description: `Covered ${hitNotes.length} of ${scaleNotes.length} target tones with live tracking.`,
        route: '/learn/scales',
        resumeHref: buildResumeHref({ root: selectedRoot, scale: scale.name }),
        contextLabel: `${selectedRoot} ${scale.name}`,
        score,
        bestStreak: hitNotes.length,
        completionState,
        weakSpots: missedNotes.slice(0, 4),
        notesHit: hitNotes.length,
        totalNotes: scaleNotes.length,
        timeSpentMs,
        missedNotes,
        root: selectedRoot,
        scaleName: scale.name
      }
    },
    [buildResumeHref, hitNotes, scale.name, scaleNotes, selectedRoot]
  )

  const { savedSummary, finalizeSession, startSession, resetSessionStart } = useLearnSession({
    module: 'scale-explorer',
    lessonStepId: lessonStep?.id,
    sessionKey: lessonStep ? null : buildResumeHref({ root: rootParam, scale: scaleParam }),
    hasActivity: () => isPracticing || hitNotes.length > 0 || sessionStartedAt.current !== null,
    buildSummary: () => {
      const startedAt = sessionStartedAt.current ?? Date.now()
      return buildSummary(Math.max(0, Date.now() - startedAt))
    },
    sessionStartedAtRef: sessionStartedAt
  })

  const displayedSummary =
    (isPracticing || hitNotes.length > 0 ? buildSummary(0) : null) ??
    (savedSummary?.module === 'scale-explorer' ? savedSummary : null)

  const handleTogglePractice = () => {
    if (isPracticing) {
      finalizeSession()
      resetSessionStart()
      stopPractice()
      return
    }

    startSession()
    void startPractice()
  }

  return (
    <LearnToolLayout
      title="Scale Explorer"
      description="Browse scale shapes, then switch into live practice to track which notes you have already covered."
      lessonStep={lessonStep}
      actions={
        <button
          onClick={() => {
            resetSessionStart()
            resetProgress()
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
        >
          <RotateCcw size={14} />
          Reset Progress
        </button>
      }
    >
      {!isConnected && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          Live pitch practice is currently unavailable. You can still browse the scale layout and
          note map while the input is disconnected.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <LearnStatCard label="Scale" value={`${selectedRoot} ${scale.name}`} />
        <LearnStatCard label="Progress" value={`${hitNotes.length}/${scaleNotes.length} notes`} />
        <LearnStatCard
          label="Detected note"
          value={
            currentDetectedNote
              ? `${currentDetectedNote}${currentDetectedOctave ?? ''}`
              : 'Waiting for pitch'
          }
        />
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
                    selectedRoot === note
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
                    selectedScaleIndex === index
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
            <div className="text-sm font-medium text-white">Scale notes</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {scaleNotes.map((note) => (
                <span
                  key={note}
                  className={`rounded-full px-3 py-1 text-sm font-mono ${
                    hitNotes.includes(note)
                      ? 'bg-emerald-600 text-white'
                      : currentDetectedNote === note
                        ? 'bg-yellow-500 text-black'
                        : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-xl">
            <Fretboard
              highlightedPositions={positions}
              activeNote={activeNote}
              rootNote={selectedRoot}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isConnected && (
              <button
                onClick={handleTogglePractice}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  isPracticing
                    ? 'bg-rose-600 text-white hover:bg-rose-500'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {isPracticing ? 'Stop Practice' : 'Start Practice'}
              </button>
            )}
            <span className="text-sm text-zinc-400">
              {isPracticing
                ? hitNotes.length === scaleNotes.length
                  ? 'All scale notes have been hit.'
                  : 'Play through the highlighted notes to fill the progress summary.'
                : 'Use the live practice mode to track which scale tones you have already played.'}
            </span>
          </div>
        </div>
      </div>

      {displayedSummary?.module === 'scale-explorer' && (
        <LearnSessionSummary
          title={displayedSummary.title}
          description={displayedSummary.description}
          footer={
            displayedSummary.timeSpentMs
              ? `${Math.max(1, Math.round(displayedSummary.timeSpentMs / 1000))}s`
              : undefined
          }
          metrics={[
            {
              label: 'Notes hit',
              value: `${displayedSummary.notesHit}/${displayedSummary.totalNotes}`
            },
            {
              label: 'Coverage',
              value: `${Math.round(displayedSummary.score ?? 0)}%`,
              tone:
                (displayedSummary.score ?? 0) >= 100
                  ? 'good'
                  : (displayedSummary.score ?? 0) >= 60
                    ? 'warning'
                    : 'default'
            },
            {
              label: 'Missed tones',
              value: displayedSummary.missedNotes.length
                ? displayedSummary.missedNotes.join(', ')
                : 'None',
              tone: displayedSummary.missedNotes.length ? 'warning' : 'good'
            },
            { label: 'Pattern', value: `${displayedSummary.root} ${displayedSummary.scaleName}` }
          ]}
          weakSpots={displayedSummary.weakSpots}
        />
      )}
    </LearnToolLayout>
  )
}
