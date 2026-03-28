import { RefreshCw } from 'lucide-react'
import { useDevices } from '../../hooks/useDevices'
import { useSystemStatus } from '../../hooks/useSystemStatus'
import { useAppSettingsStore } from '../../stores/app-settings-store'

export function DeviceSelector(): JSX.Element {
  const {
    inputDevices,
    outputDevices,
    inputDeviceId,
    outputDeviceId,
    setInputDeviceId,
    setOutputDeviceId,
    devicesLoading,
    refreshDevices
  } = useDevices()
  const { permissionState } = useSystemStatus()
  const compactControls = useAppSettingsStore((s) => s.interface.compactControls)

  const baseSelectClass = `rounded-xl border border-zinc-700 bg-zinc-800 text-white transition-colors focus:border-emerald-500 focus:outline-none ${
    compactControls ? 'min-w-52 px-3 py-2 text-sm' : 'min-w-60 px-3 py-2.5 text-sm'
  }`

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-white">Audio devices</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {devicesLoading
              ? 'Refreshing available devices…'
              : permissionState === 'denied'
                ? 'Microphone access is blocked. Device labels may stay hidden until permission is granted.'
                : 'Pick the input and output routing Soundgarden should use.'}
          </p>
        </div>
        <button
          onClick={() => void refreshDevices()}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.18em] text-zinc-500">Input</label>
          <select
            className={baseSelectClass}
            value={inputDeviceId ?? ''}
            onChange={(e) => setInputDeviceId(e.target.value || null)}
            disabled={devicesLoading}
          >
            <option value="">
              {inputDevices.length > 0 ? 'Select input device…' : 'No inputs detected'}
            </option>
            {inputDevices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-500">
            {inputDevices.length > 0
              ? `${inputDevices.length} input device${inputDevices.length === 1 ? '' : 's'} available`
              : 'Connect an audio interface or grant microphone permission to populate this list.'}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.18em] text-zinc-500">Output</label>
          <select
            className={baseSelectClass}
            value={outputDeviceId ?? ''}
            onChange={(e) => setOutputDeviceId(e.target.value || null)}
            disabled={devicesLoading}
          >
            <option value="">Default output</option>
            {outputDevices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-500">
            {outputDevices.length > 0
              ? `Using ${outputDeviceId ? 'a dedicated output device' : 'the system default output'}`
              : 'Soundgarden can still use the system default output even when this list is empty.'}
          </span>
        </div>
      </div>
    </div>
  )
}
