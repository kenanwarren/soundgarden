import { RotateCcw } from 'lucide-react'
import { NOTE_NAMES } from '../../utils/constants'
import { SCALES, getScaleNotes } from '../../utils/scale-data'
import { getScalePositions } from '../../utils/fretboard-data'
import { useScaleStore } from '../../stores/scale-store'
import { useScalePractice } from '../../hooks/useScalePractice'
import { Fretboard } from '../common/Fretboard'
import { PageHeader } from '../layout/PageHeader'

function SummaryCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-medium text-white">{value}</div>
    </div>
  )
}

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

  const scale = SCALES[selectedScaleIndex]
  const scaleNotes = getScaleNotes(selectedRoot, scale)
  const positions = getScalePositions(scaleNotes)

  const activeNote =
    currentDetectedNote && currentDetectedOctave !== null
      ? { note: currentDetectedNote, octave: currentDetectedOctave }
      : null

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <PageHeader
        title="Scale Explorer"
        description="Browse scale shapes, then switch into live practice to track which notes you have already covered."
        backTo="/learn"
        actions={
          <button
            onClick={resetProgress}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <RotateCcw size={14} />
            Reset Progress
          </button>
        }
      />

      {!isConnected && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          Live pitch practice is currently unavailable. You can still browse the scale layout and
          note map while the input is disconnected.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Scale" value={`${selectedRoot} ${scale.name}`} />
        <SummaryCard label="Progress" value={`${hitNotes.length}/${scaleNotes.length} notes`} />
        <SummaryCard
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
                onClick={isPracticing ? stopPractice : () => void startPractice()}
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
    </div>
  )
}
