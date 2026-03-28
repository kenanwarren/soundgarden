import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { NOTE_NAMES } from '../../utils/constants'
import { SCALES, getScaleNotes } from '../../utils/scale-data'
import { getScalePositions } from '../../utils/fretboard-data'
import { useScaleStore } from '../../stores/scale-store'
import { useScalePractice } from '../../hooks/useScalePractice'
import { Fretboard } from '../common/Fretboard'

export function ScalePanel(): JSX.Element {
  const {
    selectedRoot,
    selectedScaleIndex,
    hitNotes,
    currentDetectedNote,
    currentDetectedOctave,
    setRoot,
    setScaleIndex
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
    <div className="flex flex-col h-full p-8 gap-6">
      <div className="flex items-center gap-4">
        <Link to="/learn" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-white">Scale Explorer</h2>
      </div>

      {/* Root note selector */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-zinc-400 uppercase tracking-wider">Root</span>
        <div className="flex gap-1 flex-wrap">
          {NOTE_NAMES.map((note) => (
            <button
              key={note}
              onClick={() => setRoot(note)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
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

      {/* Scale selector */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-zinc-400 uppercase tracking-wider">Scale</span>
        <div className="flex gap-2 flex-wrap">
          {SCALES.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setScaleIndex(i)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedScaleIndex === i
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Scale notes display */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-400">Notes:</span>
        <div className="flex gap-2">
          {scaleNotes.map((note) => (
            <span
              key={note}
              className={`px-2 py-1 rounded text-sm font-mono ${
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
        {isPracticing && (
          <span className="text-sm text-zinc-500 ml-auto">
            {hitNotes.length}/{scaleNotes.length} notes
          </span>
        )}
      </div>

      {/* Fretboard */}
      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
        <Fretboard
          highlightedPositions={positions}
          activeNote={activeNote}
          rootNote={selectedRoot}
        />
      </div>

      {/* Practice controls */}
      <div className="flex items-center gap-4">
        {!isConnected ? (
          <p className="text-zinc-400 text-sm">Connect your audio input on the Home page to practice</p>
        ) : (
          <button
            onClick={isPracticing ? stopPractice : startPractice}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isPracticing
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-zinc-700 hover:bg-zinc-600 text-white'
            }`}
          >
            {isPracticing ? 'Stop Practice' : 'Start Practice'}
          </button>
        )}

        {isPracticing && hitNotes.length === scaleNotes.length && (
          <span className="text-emerald-400 font-medium">All notes played!</span>
        )}
      </div>
    </div>
  )
}
