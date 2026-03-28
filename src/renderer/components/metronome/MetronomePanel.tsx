import { Play, Square } from 'lucide-react'
import { useMetronome } from '../../hooks/useMetronome'
import { useMetronomeStore } from '../../stores/metronome-store'
import { BpmControl } from '../common/BpmControl'

const TIME_SIGNATURES = [2, 3, 4, 5, 6, 7]

export function MetronomePanel(): JSX.Element {
  const { bpm, beatsPerMeasure, isPlaying, start, stop, tap, setBpm } = useMetronome()
  const currentBeat = useMetronomeStore((s) => s.currentBeat)
  const accentFirst = useMetronomeStore((s) => s.accentFirst)
  const setBeatsPerMeasure = useMetronomeStore((s) => s.setBeatsPerMeasure)
  const setAccentFirst = useMetronomeStore((s) => s.setAccentFirst)

  return (
    <div className="flex flex-col gap-6">
      <BpmControl bpm={bpm} setBpm={setBpm} onTap={tap} min={20} max={240} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="text-sm font-medium text-white">Beat pulse</div>
          <p className="mt-1 text-sm text-zinc-400">
            Watch beat one stand out so the visual pulse matches the shared metronome defaults used
            across the app.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {Array.from({ length: beatsPerMeasure }, (_, i) => (
              <div
                key={i}
                className={`h-5 w-5 rounded-full transition-all ${
                  isPlaying && currentBeat === i
                    ? i === 0 && accentFirst
                      ? 'scale-125 bg-emerald-400'
                      : 'scale-110 bg-white'
                    : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
          <button
            onClick={isPlaying ? stop : start}
            className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
              isPlaying
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isPlaying ? <Square size={22} /> : <Play size={22} className="ml-1" />}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
          <div className="text-sm font-medium text-white">Time signature</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TIME_SIGNATURES.map((ts) => (
              <button
                key={ts}
                onClick={() => setBeatsPerMeasure(ts)}
                className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                  beatsPerMeasure === ts
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {ts}/4
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
          <input
            type="checkbox"
            checked={accentFirst}
            onChange={(e) => setAccentFirst(e.target.checked)}
            className="mt-1 accent-emerald-500"
          />
          <div>
            <div className="text-sm font-medium text-white">Accent first beat</div>
            <p className="mt-1 text-sm text-zinc-400">
              Give beat one a stronger click so count-ins and bar starts stay obvious.
            </p>
          </div>
        </label>
      </div>
    </div>
  )
}
