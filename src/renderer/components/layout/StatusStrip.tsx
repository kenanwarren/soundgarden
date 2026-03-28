import { Activity, Gauge, Mic, Radio, Waves } from 'lucide-react'
import { useSystemStatus } from '../../hooks/useSystemStatus'
import { useAppSettingsStore } from '../../stores/app-settings-store'

function pillToneClass(tone: 'neutral' | 'good' | 'warn' | 'danger'): string {
  if (tone === 'good') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  if (tone === 'warn') return 'border-amber-500/30 bg-amber-500/10 text-amber-200'
  if (tone === 'danger') return 'border-rose-500/30 bg-rose-500/10 text-rose-200'
  return 'border-zinc-800 bg-zinc-900/80 text-zinc-300'
}

function StatusPill({
  icon,
  label,
  value,
  tone = 'neutral'
}: {
  icon: JSX.Element
  label: string
  value: string
  tone?: 'neutral' | 'good' | 'warn' | 'danger'
}): JSX.Element {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${pillToneClass(tone)}`}
    >
      <span className="text-zinc-500">{icon}</span>
      <span className="uppercase tracking-[0.18em] text-zinc-500">{label}</span>
      <span className="font-medium text-current">{value}</span>
    </div>
  )
}

export function StatusStrip(): JSX.Element {
  const status = useSystemStatus()
  const compactControls = useAppSettingsStore((s) => s.interface.compactControls)

  const connectionTone = status.isConnected ? 'good' : 'warn'
  const latencyTone =
    status.latencyBand === 'good'
      ? 'good'
      : status.latencyBand === 'playable'
        ? 'warn'
        : status.latencyBand === 'high'
          ? 'danger'
          : 'neutral'
  const signalTone =
    status.signalBand === 'healthy'
      ? 'good'
      : status.signalBand === 'hot'
        ? 'warn'
        : status.signalBand === 'clipping'
          ? 'danger'
          : 'neutral'

  return (
    <div
      className={`flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950/90 ${
        compactControls ? 'px-4 py-2' : 'px-6 py-3'
      }`}
    >
      <StatusPill
        icon={<Radio size={14} />}
        label="Connection"
        value={status.isConnected ? 'Connected' : 'Disconnected'}
        tone={connectionTone}
      />
      <StatusPill icon={<Mic size={14} />} label="Input" value={status.inputDeviceLabel} />
      <StatusPill icon={<Waves size={14} />} label="Output" value={status.outputDeviceLabel} />
      <StatusPill
        icon={<Gauge size={14} />}
        label="Latency"
        value={status.latencyLabel}
        tone={latencyTone}
      />
      <StatusPill
        icon={<Activity size={14} />}
        label="Signal"
        value={status.signalLabel}
        tone={signalTone}
      />
      <StatusPill icon={<Radio size={14} />} label="Mode" value={status.activeMode} />
    </div>
  )
}
