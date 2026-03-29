import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, RotateCcw, X } from 'lucide-react'
import { NOTE_NAMES } from '../../utils/constants'
import { CHORD_VOICINGS, type ChordVoicing } from '../../utils/chord-voicings'
import { useChordLibraryStore } from '../../stores/chord-library-store'
import { useChordPractice } from '../../hooks/useChordPractice'
import { useLearnSession } from '../../hooks/useLearnSession'
import { ChordDiagram } from '../common/ChordDiagram'
import { useAudioStore } from '../../stores/audio-store'
import { PageHeader } from '../layout/PageHeader'
import { useLessonStep } from '../../hooks/useLessonStep'
import { buildRouteWithParams, getChordIndexByName } from '../../utils/learn-data'
import { LearnSessionSummary } from './LearnSessionSummary'
import type { CompletionState } from '../../utils/learn-types'
import { GuidedStepBanner } from './GuidedStepBanner'
import { LearnStatCard } from './LearnStatCard'

const CATEGORIES = [
  { value: 'all' as const, label: 'All' },
  { value: 'open' as const, label: 'Open' },
  { value: 'barre' as const, label: 'Barre' },
  { value: 'extended' as const, label: 'Extended' }
]

function ChordPracticeIndicator({
  voicing,
  lessonStepId,
  resumeHref
}: {
  voicing: ChordVoicing
  lessonStepId?: string
  resumeHref: string
}) {
  const isConnected = useAudioStore((s) => s.isConnected)
  const {
    start,
    stop,
    isActive,
    currentChord,
    isMatch,
    cleanMatchCount,
    mismatchCount,
    mismatches
  } = useChordPractice(voicing.root, voicing.quality)

  function buildSummary() {
    const totalDetections = cleanMatchCount + mismatchCount
    const score = totalDetections > 0 ? (cleanMatchCount / totalDetections) * 100 : 0
    const completionState: CompletionState =
      cleanMatchCount >= 3 ? 'completed' : totalDetections > 0 ? 'in-progress' : 'not-started'

    return {
      module: 'chord-library' as const,
      title: `${voicing.name} chord session`,
      description: `Tracked ${cleanMatchCount} clean matches against ${mismatchCount} mismatches.`,
      route: '/learn/chords',
      resumeHref,
      contextLabel: voicing.name,
      score,
      bestStreak: cleanMatchCount,
      completionState,
      weakSpots: mismatches.slice(0, 4),
      targetChord: voicing.name,
      cleanMatchCount,
      mismatches
    }
  }

  const { savedSummary, finalizeSession } = useLearnSession({
    module: 'chord-library',
    lessonStepId,
    sessionKey: resumeHref,
    hasActivity: () => isActive || cleanMatchCount > 0 || mismatchCount > 0,
    buildSummary
  })

  const displayedSummary =
    (isActive || cleanMatchCount > 0 || mismatchCount > 0 ? buildSummary() : null) ??
    (savedSummary?.module === 'chord-library' && savedSummary.targetChord === voicing.name
      ? savedSummary
      : null)

  if (!isConnected) {
    return (
      <p className="mt-3 text-sm text-zinc-500">
        Connect audio to compare your strum against this voicing.
      </p>
    )
  }

  return (
    <div className="mt-3 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={
            isActive
              ? () => {
                  finalizeSession()
                  stop()
                }
              : () => {
                  start()
                }
          }
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            isActive
              ? 'bg-rose-600 text-white hover:bg-rose-500'
              : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
        >
          {isActive ? 'Stop Practice' : 'Practice This Chord'}
        </button>
        {isActive && (
          <div className="flex items-center gap-2 text-sm">
            {isMatch ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Check size={16} /> Correct
              </span>
            ) : currentChord ? (
              <span className="flex items-center gap-1 text-yellow-400">
                <X size={16} /> Detected: {currentChord.name}
              </span>
            ) : (
              <span className="text-zinc-500">Play the chord cleanly and let it settle.</span>
            )}
          </div>
        )}
      </div>

      {displayedSummary?.module === 'chord-library' && (
        <LearnSessionSummary
          title={displayedSummary.title}
          description={displayedSummary.description}
          metrics={[
            {
              label: 'Clean matches',
              value: String(displayedSummary.cleanMatchCount),
              tone: displayedSummary.cleanMatchCount >= 3 ? 'good' : 'default'
            },
            {
              label: 'Mismatches',
              value: displayedSummary.mismatches.length
                ? displayedSummary.mismatches.join(', ')
                : 'None',
              tone: displayedSummary.mismatches.length ? 'warning' : 'good'
            },
            { label: 'Target', value: displayedSummary.targetChord },
            {
              label: 'Score',
              value: `${Math.round(displayedSummary.score ?? 0)}%`,
              tone:
                (displayedSummary.score ?? 0) >= 80
                  ? 'good'
                  : (displayedSummary.score ?? 0) >= 50
                    ? 'warning'
                    : 'default'
            }
          ]}
          weakSpots={displayedSummary.weakSpots}
        />
      )}
    </div>
  )
}

export function ChordLibraryPanel(): JSX.Element {
  const [searchParams] = useSearchParams()
  const {
    selectedChordIndex,
    filterRoot,
    filterCategory,
    setSelectedChord,
    setFilterRoot,
    setFilterCategory
  } = useChordLibraryStore()
  const isConnected = useAudioStore((s) => s.isConnected)
  const lessonStep = useLessonStep('chord-library')
  const rootParam = searchParams.get('root')
  const categoryParam = searchParams.get('category')
  const chordParam = searchParams.get('chord')

  const filtered = CHORD_VOICINGS.filter((voicing) => {
    if (filterRoot && voicing.root !== filterRoot) return false
    if (filterCategory !== 'all' && voicing.category !== filterCategory) return false
    return true
  })

  const selectedVoicing = selectedChordIndex !== null ? CHORD_VOICINGS[selectedChordIndex] : null
  const resumeHref = lessonStep
    ? buildRouteWithParams('/learn/chords', { lesson: lessonStep.id })
    : buildRouteWithParams('/learn/chords', {
        root: filterRoot,
        category: filterCategory,
        chord: selectedVoicing?.name ?? null
      })

  useEffect(() => {
    if (!lessonStep || lessonStep.prefill.module !== 'chord-library') return
    setFilterCategory(lessonStep.prefill.filterCategory)
    setFilterRoot(lessonStep.prefill.filterRoot ?? null)
    const chordIndex = lessonStep.prefill.chordName
      ? getChordIndexByName(lessonStep.prefill.chordName)
      : null
    setSelectedChord(chordIndex)
  }, [lessonStep, setFilterCategory, setFilterRoot, setSelectedChord])

  useEffect(() => {
    if (lessonStep) return
    if (rootParam) setFilterRoot(rootParam)
    if (
      categoryParam === 'all' ||
      categoryParam === 'open' ||
      categoryParam === 'barre' ||
      categoryParam === 'extended'
    ) {
      setFilterCategory(categoryParam)
    }
    if (chordParam) {
      setSelectedChord(getChordIndexByName(chordParam))
    }
  }, [
    categoryParam,
    chordParam,
    lessonStep,
    rootParam,
    setFilterCategory,
    setFilterRoot,
    setSelectedChord
  ])

  const clearFilters = () => {
    setFilterRoot(null)
    setFilterCategory('all')
    setSelectedChord(null)
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <PageHeader
        title="Chord Library"
        description="Browse voicings by root and shape category, then switch into live practice when you want instant feedback on the chord you strum."
        backTo="/learn"
        actions={
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <RotateCcw size={14} />
            Clear Filters
          </button>
        }
      />

      {lessonStep && (
        <GuidedStepBanner title={lessonStep.title} description={lessonStep.description} />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <LearnStatCard label="Filtered voicings" value={String(filtered.length)} />
        <LearnStatCard label="Selected chord" value={selectedVoicing?.name ?? 'None selected'} />
        <LearnStatCard
          label="Practice mode"
          value={isConnected ? 'Live audio ready' : 'Browse-only until input connects'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="text-sm font-medium text-white">Filters</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Root</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterRoot(null)}
                  className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                    filterRoot === null
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  All
                </button>
                {NOTE_NAMES.map((note) => (
                  <button
                    key={note}
                    onClick={() => setFilterRoot(note)}
                    className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                      filterRoot === note
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Type</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {CATEGORIES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilterCategory(value)}
                    className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                      filterCategory === value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 text-sm text-zinc-400">
          Use the filters to narrow the voicing grid first, then open a chord card to inspect
          fingering and try live practice when your input is connected.
        </div>
      </div>

      {selectedVoicing && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
          <div className="flex items-start gap-6">
            <ChordDiagram voicing={selectedVoicing} size="lg" />
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold text-white">{selectedVoicing.name}</h3>
              <p className="text-sm text-zinc-400">
                Root: {selectedVoicing.root} · Quality: {selectedVoicing.quality} ·{' '}
                {selectedVoicing.category}
              </p>
              <div className="mt-1 flex gap-2">
                {selectedVoicing.frets.map((fret, index) => (
                  <span key={index} className="w-8 text-center font-mono text-sm text-zinc-300">
                    {fret === null ? 'x' : fret}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setSelectedChord(null)}
              className="ml-auto rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <ChordPracticeIndicator
            voicing={selectedVoicing}
            lessonStepId={lessonStep?.id}
            resumeHref={resumeHref}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3 overflow-auto">
        {filtered.map((voicing) => {
          const globalIndex = CHORD_VOICINGS.indexOf(voicing)
          return (
            <button
              key={`${voicing.name}-${globalIndex}`}
              onClick={() => setSelectedChord(globalIndex)}
              className={`rounded-2xl border bg-zinc-900/80 p-2 transition-colors hover:border-emerald-600 ${
                selectedChordIndex === globalIndex ? 'border-emerald-600' : 'border-zinc-800'
              }`}
            >
              <ChordDiagram voicing={voicing} size="sm" />
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-zinc-500">No chords match the current filters.</p>
        )}
      </div>
    </div>
  )
}
