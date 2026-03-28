import { Play, Square, Minus, Plus } from 'lucide-react'
import { useMetronome } from '../../hooks/useMetronome'
import { useMetronomeStore } from '../../stores/metronome-store'

const TIME_SIGNATURES = [2, 3, 4, 5, 6, 7]

export function MetronomePanel(): JSX.Element {
  const { bpm, beatsPerMeasure, isPlaying, start, stop, tap, setBpm } = useMetronome()
  const currentBeat = useMetronomeStore((s) => s.currentBeat)
  const accentFirst = useMetronomeStore((s) => s.accentFirst)
  const setBeatsPerMeasure = useMetronomeStore((s) => s.setBeatsPerMeasure)
  const setAccentFirst = useMetronomeStore((s) => s.setAccentFirst)

  return (
    <div className="flex flex-col items-center gap-8">
      {/* BPM display */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setBpm(bpm - 1)}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          <Minus size={18} />
        </button>

        <div className="flex flex-col items-center">
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
            className="w-24 text-center text-5xl font-bold bg-transparent text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-zinc-500">BPM</span>
        </div>

        <button
          onClick={() => setBpm(bpm + 1)}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Beat indicators */}
      <div className="flex gap-3">
        {Array.from({ length: beatsPerMeasure }, (_, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full transition-all ${
              isPlaying && currentBeat === i
                ? i === 0 && accentFirst
                  ? 'bg-emerald-400 scale-125'
                  : 'bg-white scale-110'
                : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={isPlaying ? stop : start}
          className={`w-14 h-14 flex items-center justify-center rounded-full transition-all ${
            isPlaying
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isPlaying ? <Square size={20} /> : <Play size={20} className="ml-1" />}
        </button>

        <button
          onClick={tap}
          className="px-5 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors font-medium text-sm"
        >
          Tap
        </button>
      </div>

      {/* Settings */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Time</span>
          <div className="flex gap-1">
            {TIME_SIGNATURES.map((ts) => (
              <button
                key={ts}
                onClick={() => setBeatsPerMeasure(ts)}
                className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
                  beatsPerMeasure === ts
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {ts}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={accentFirst}
            onChange={(e) => setAccentFirst(e.target.checked)}
            className="accent-emerald-500"
          />
          <span className="text-sm text-zinc-400">Accent first beat</span>
        </label>
      </div>

      {/* BPM slider */}
      <input
        type="range"
        min={20}
        max={300}
        value={bpm}
        onChange={(e) => setBpm(parseInt(e.target.value))}
        className="w-64 accent-emerald-500"
      />
    </div>
  )
}
