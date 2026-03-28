import { useTunerStore } from '../../stores/tuner-store'
import { TUNING_PRESETS } from '../../utils/constants'

export function TunerSettings(): JSX.Element {
  const { referenceA4, setReferenceA4 } = useTunerStore()

  return (
    <div className="flex flex-col gap-4 items-center">
      {/* Reference pitch */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-zinc-400">A4 =</label>
        <input
          type="range"
          min={430}
          max={450}
          step={1}
          value={referenceA4}
          onChange={(e) => setReferenceA4(parseInt(e.target.value))}
          className="w-32 accent-emerald-500"
        />
        <span className="text-sm font-mono text-white w-16">{referenceA4} Hz</span>
      </div>

      {/* Tuning presets */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Object.entries(TUNING_PRESETS).map(([name, notes]) => (
          <button
            key={name}
            className="px-3 py-1.5 text-xs bg-zinc-800 rounded border border-zinc-700 hover:border-emerald-500 text-zinc-300 hover:text-white transition-colors"
            title={notes.join(' ')}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}
