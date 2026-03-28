import { Minus, Plus, Timer } from 'lucide-react'
import { useAppSettingsStore } from '../../stores/app-settings-store'

interface BpmControlProps {
  bpm: number
  setBpm: (bpm: number) => void
  onTap?: () => void
  min?: number
  max?: number
  step?: number
  label?: string
}

export function BpmControl({
  bpm,
  setBpm,
  onTap,
  min = 20,
  max = 240,
  step = 1,
  label = 'Tempo'
}: BpmControlProps): JSX.Element {
  const compactControls = useAppSettingsStore((s) => s.interface.compactControls)

  const applyDelta = (delta: number) => {
    setBpm(bpm + delta)
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
      <div className="flex flex-wrap items-center gap-5">
        <div>
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</span>
          <div className="mt-2 flex items-end gap-2">
            <span
              className={`${compactControls ? 'text-4xl' : 'text-5xl'} font-semibold text-white`}
            >
              {bpm}
            </span>
            <span className="pb-1 text-sm text-zinc-500">BPM</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => applyDelta(-step)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
            aria-label="Decrease tempo"
          >
            <Minus size={16} />
          </button>
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value) || min)}
            className="w-24 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-center text-lg font-medium text-white outline-none transition-colors focus:border-emerald-500"
          />
          <button
            onClick={() => applyDelta(step)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
            aria-label="Increase tempo"
          >
            <Plus size={16} />
          </button>
          {onTap && (
            <button
              onClick={onTap}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
            >
              <Timer size={14} />
              Tap
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        className="mt-4 w-full accent-emerald-500"
      />
    </div>
  )
}
