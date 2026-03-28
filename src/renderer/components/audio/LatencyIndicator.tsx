import { getEngine } from '../../hooks/useAudioEngine'
import { useAudioStore } from '../../stores/audio-store'

export function LatencyIndicator(): JSX.Element {
  const isConnected = useAudioStore((s) => s.isConnected)
  const engine = getEngine()
  const latencyMs = engine ? (engine.latencyEstimate * 1000).toFixed(1) : '—'

  return (
    <div className="flex flex-col gap-1 items-center">
      <label className="text-xs text-zinc-400 uppercase tracking-wide">Latency</label>
      <span className={`text-sm font-mono ${isConnected ? 'text-white' : 'text-zinc-600'}`}>
        {isConnected ? `${latencyMs}ms` : '—'}
      </span>
    </div>
  )
}
