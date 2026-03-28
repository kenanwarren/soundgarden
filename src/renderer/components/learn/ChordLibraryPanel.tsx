import { Link } from 'react-router-dom'
import { ArrowLeft, Check, X } from 'lucide-react'
import { NOTE_NAMES } from '../../utils/constants'
import { CHORD_VOICINGS, type ChordVoicing } from '../../utils/chord-voicings'
import { useChordLibraryStore } from '../../stores/chord-library-store'
import { useChordPractice } from '../../hooks/useChordPractice'
import { ChordDiagram } from '../common/ChordDiagram'
import { useAudioStore } from '../../stores/audio-store'

const CATEGORIES = [
  { value: 'all' as const, label: 'All' },
  { value: 'open' as const, label: 'Open' },
  { value: 'barre' as const, label: 'Barre' },
  { value: 'extended' as const, label: 'Extended' }
]

function ChordPracticeIndicator({ voicing }: { voicing: ChordVoicing }) {
  const isConnected = useAudioStore((s) => s.isConnected)
  const { start, stop, isActive, currentChord, isMatch } = useChordPractice(
    voicing.root,
    voicing.quality
  )

  if (!isConnected) return null

  return (
    <div className="flex items-center gap-3 mt-2">
      <button
        onClick={isActive ? stop : start}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-zinc-700 hover:bg-zinc-600 text-white'
        }`}
      >
        {isActive ? 'Stop' : 'Practice'}
      </button>
      {isActive && (
        <div className="flex items-center gap-2">
          {isMatch ? (
            <span className="flex items-center gap-1 text-emerald-400 text-sm">
              <Check size={16} /> Correct!
            </span>
          ) : currentChord ? (
            <span className="flex items-center gap-1 text-yellow-400 text-sm">
              <X size={16} /> Detected: {currentChord.name}
            </span>
          ) : (
            <span className="text-zinc-500 text-sm">Play the chord...</span>
          )}
        </div>
      )}
    </div>
  )
}

export function ChordLibraryPanel(): JSX.Element {
  const {
    selectedChordIndex,
    filterRoot,
    filterCategory,
    setSelectedChord,
    setFilterRoot,
    setFilterCategory
  } = useChordLibraryStore()

  const filtered = CHORD_VOICINGS.filter((v) => {
    if (filterRoot && v.root !== filterRoot) return false
    if (filterCategory !== 'all' && v.category !== filterCategory) return false
    return true
  })

  const selectedVoicing =
    selectedChordIndex !== null ? CHORD_VOICINGS[selectedChordIndex] : null

  return (
    <div className="flex flex-col h-full p-8 gap-6">
      <div className="flex items-center gap-4">
        <Link to="/learn" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-white">Chord Library</h2>
      </div>

      {/* Filters */}
      <div className="flex gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-zinc-400 uppercase tracking-wider">Root</span>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterRoot(null)}
              className={`px-2.5 py-1 rounded text-sm transition-colors ${
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
                className={`px-2.5 py-1 rounded text-sm transition-colors ${
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

        <div className="flex flex-col gap-2">
          <span className="text-sm text-zinc-400 uppercase tracking-wider">Type</span>
          <div className="flex gap-1">
            {CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterCategory(value)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
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

      {/* Selected chord detail */}
      {selectedVoicing && (
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 flex items-start gap-6">
          <ChordDiagram voicing={selectedVoicing} size="lg" />
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">{selectedVoicing.name}</h3>
            <p className="text-sm text-zinc-400">
              Root: {selectedVoicing.root} &middot; Quality: {selectedVoicing.quality} &middot;{' '}
              {selectedVoicing.category}
            </p>
            <div className="flex gap-1 mt-1">
              {selectedVoicing.frets.map((f, i) => (
                <span key={i} className="w-8 text-center text-sm font-mono text-zinc-300">
                  {f === null ? 'x' : f}
                </span>
              ))}
            </div>
            <ChordPracticeIndicator voicing={selectedVoicing} />
          </div>
          <button
            onClick={() => setSelectedChord(null)}
            className="ml-auto text-zinc-500 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Chord grid */}
      <div className="flex flex-wrap gap-3 overflow-auto">
        {filtered.map((voicing) => {
          const globalIndex = CHORD_VOICINGS.indexOf(voicing)
          return (
            <button
              key={`${voicing.name}-${globalIndex}`}
              onClick={() => setSelectedChord(globalIndex)}
              className={`bg-zinc-900 rounded-lg border p-2 transition-colors hover:border-emerald-600 ${
                selectedChordIndex === globalIndex
                  ? 'border-emerald-600'
                  : 'border-zinc-800'
              }`}
            >
              <ChordDiagram voicing={voicing} size="sm" />
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-zinc-500">No chords match the current filters</p>
        )}
      </div>
    </div>
  )
}
