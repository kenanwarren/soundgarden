import { useDevices } from '../../hooks/useDevices'

export function DeviceSelector(): JSX.Element {
  const {
    inputDevices,
    outputDevices,
    inputDeviceId,
    outputDeviceId,
    setInputDeviceId,
    setOutputDeviceId
  } = useDevices()

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-400 uppercase tracking-wide">Input</label>
        <select
          className="bg-zinc-800 text-white text-sm rounded px-3 py-2 border border-zinc-700 focus:border-emerald-500 focus:outline-none min-w-48"
          value={inputDeviceId ?? ''}
          onChange={(e) => setInputDeviceId(e.target.value || null)}
        >
          <option value="">Select input device...</option>
          {inputDevices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-400 uppercase tracking-wide">Output</label>
        <select
          className="bg-zinc-800 text-white text-sm rounded px-3 py-2 border border-zinc-700 focus:border-emerald-500 focus:outline-none min-w-48"
          value={outputDeviceId ?? ''}
          onChange={(e) => setOutputDeviceId(e.target.value || null)}
        >
          <option value="">Default output</option>
          {outputDevices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
