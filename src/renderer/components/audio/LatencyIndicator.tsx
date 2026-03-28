import { useSystemStatus } from '../../hooks/useSystemStatus'

export function LatencyIndicator(): JSX.Element {
  const { isConnected, latencyLabel } = useSystemStatus()

  return (
    <div className="flex flex-col gap-1 items-center">
      <label className="text-xs text-zinc-400 uppercase tracking-wide">Latency</label>
      <span className={`text-sm font-mono ${isConnected ? 'text-white' : 'text-zinc-600'}`}>
        {isConnected ? latencyLabel : '—'}
      </span>
    </div>
  )
}
