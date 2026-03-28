import { Link } from 'react-router-dom'
import { useTunerStore } from '../../stores/tuner-store'
import { TUNING_PRESETS } from '../../utils/constants'
import { useAppSettingsStore } from '../../stores/app-settings-store'

export function TunerSettings(): JSX.Element {
  const { selectedPreset, targetNotes, setPreset } = useTunerStore()
  const showTooltips = useAppSettingsStore((s) => s.interface.showTooltips)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-medium text-white">Target tuning</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Pick the string set you are tuning to. Reference pitch lives in Settings now so the live
          page stays focused.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(TUNING_PRESETS).map(([name, notes]) => (
          <button
            key={name}
            onClick={() => setPreset(name as keyof typeof TUNING_PRESETS)}
            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
              selectedPreset === name
                ? 'border-emerald-500/40 bg-emerald-500/10 text-white'
                : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
            title={showTooltips ? notes.join(' ') : undefined}
          >
            <span className="block text-sm font-medium">{name}</span>
            <span className="mt-1 block text-xs text-zinc-500">{notes.join(' ')}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          Current string targets
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {targetNotes.map((note) => (
            <span
              key={note}
              className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm font-mono text-zinc-200"
            >
              {note}
            </span>
          ))}
        </div>
      </div>

      <Link to="/settings" className="text-sm text-zinc-400 transition-colors hover:text-white">
        Adjust A4 calibration in Settings
      </Link>
    </div>
  )
}
