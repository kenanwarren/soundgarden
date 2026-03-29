import { useAudioStore } from '../../stores/audio-store'
import { useAppSettingsStore } from '../../stores/app-settings-store'
import { useSystemStatus } from '../../hooks/useSystemStatus'

function StatusCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  )
}

export function AudioStatusCards({
  includeActiveMode = true,
  includeSampleRate = true,
  className = 'grid gap-3 md:grid-cols-2 xl:grid-cols-3'
}: {
  includeActiveMode?: boolean
  includeSampleRate?: boolean
  className?: string
}): JSX.Element {
  const status = useSystemStatus()
  const sampleRate = useAudioStore((s) => s.sampleRate)
  const monitoringEnabled = useAppSettingsStore((s) => s.audio.monitoringEnabled)
  const masterVolume = useAppSettingsStore((s) => s.audio.masterVolume)

  const monitoringLabel = !monitoringEnabled
    ? 'Muted'
    : `${Math.round(masterVolume * 100)}%${masterVolume > 0.85 ? ' (Hot)' : ''}`

  return (
    <div className={className}>
      <StatusCard label="Permission" value={status.permissionState} />
      <StatusCard label="Connection" value={status.isConnected ? 'Connected' : 'Disconnected'} />
      <StatusCard label="Signal" value={status.signalLabel} />
      <StatusCard label="Latency" value={status.latencyLabel} />
      <StatusCard label="Monitoring" value={monitoringLabel} />
      {includeSampleRate && (
        <StatusCard
          label="Sample Rate"
          value={sampleRate ? `${Math.round(sampleRate / 1000)} kHz` : 'Unavailable'}
        />
      )}
      {includeActiveMode && <StatusCard label="Active Mode" value={status.activeMode} />}
    </div>
  )
}
