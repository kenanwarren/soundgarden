import { Link } from 'react-router-dom'
import { CheckCircle2, CircleAlert, Power } from 'lucide-react'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { useDevices } from '../hooks/useDevices'
import { useSystemStatus } from '../hooks/useSystemStatus'
import { DeviceSelector } from '../components/audio/DeviceSelector'
import { AudioMeter } from '../components/audio/AudioMeter'
import { AudioDiagnosticsPanel } from '../components/audio/AudioDiagnosticsPanel'
import { AudioStatusCards } from '../components/audio/AudioStatusCards'
import { LatencyIndicator } from '../components/audio/LatencyIndicator'
import { VolumeSlider } from '../components/audio/VolumeSlider'
import { PageHeader } from '../components/layout/PageHeader'
import { useAppSettingsStore } from '../stores/app-settings-store'

function ChecklistItem({
  title,
  description,
  state
}: {
  title: string
  description: string
  state: 'good' | 'warning'
}): JSX.Element {
  const icon =
    state === 'good' ? (
      <CheckCircle2 size={16} className="text-emerald-300" />
    ) : (
      <CircleAlert size={16} className="text-amber-300" />
    )

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        state === 'good'
          ? 'border-emerald-500/20 bg-emerald-500/10'
          : 'border-amber-500/20 bg-amber-500/10'
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-white">{title}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-zinc-300">{description}</p>
    </div>
  )
}

export function HomePage(): JSX.Element {
  const { isConnected, connect, disconnect } = useAudioEngine()
  const { inputDeviceId } = useDevices()
  const status = useSystemStatus()
  const monitoringEnabled = useAppSettingsStore((s) => s.audio.monitoringEnabled)
  const masterVolume = useAppSettingsStore((s) => s.audio.masterVolume)

  const handleToggle = () => {
    if (isConnected) {
      disconnect()
    } else if (inputDeviceId) {
      void connect(inputDeviceId)
    }
  }

  const signalDetected = ['healthy', 'hot', 'clipping'].includes(status.signalBand)
  const monitoringSafe = !monitoringEnabled || masterVolume <= 0.85

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Setup"
        description="Soundgarden is ready once permission, routing, and monitoring are all in a healthy state. This page keeps the live-input setup obvious before you jump into a tool."
        actions={
          <>
            <button
              onClick={handleToggle}
              disabled={!inputDeviceId && !isConnected}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isConnected
                  ? 'bg-rose-600 text-white hover:bg-rose-500'
                  : inputDeviceId
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'cursor-not-allowed bg-zinc-800 text-zinc-500'
              }`}
            >
              <Power size={14} />
              {isConnected ? 'Disconnect Input' : 'Connect Selected Input'}
            </button>
            <Link
              to="/settings"
              className="rounded-xl border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
            >
              Open Settings
            </Link>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] 2xl:grid-cols-[minmax(0,1.02fr)_minmax(440px,0.98fr)]">
        <div className="space-y-6">
          <DeviceSelector />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <ChecklistItem
              title="Microphone permission"
              description={
                status.permissionState === 'denied'
                  ? 'Grant microphone access in system settings before using tuner, chord detection, or practice tools.'
                  : status.permissionState === 'granted'
                    ? 'Permission is already granted.'
                    : 'Soundgarden will request access when you connect your input.'
              }
              state={status.permissionState === 'denied' ? 'warning' : 'good'}
            />
            <ChecklistItem
              title="Input selected"
              description={
                inputDeviceId
                  ? `${status.inputDeviceLabel} is ready to connect.`
                  : 'Choose the interface or microphone you want to practice with.'
              }
              state={inputDeviceId ? 'good' : 'warning'}
            />
            <ChecklistItem
              title="Output path"
              description={`Playback is routed to ${status.outputDeviceLabel}.`}
              state="good"
            />
            <ChecklistItem
              title="Signal check"
              description={
                isConnected
                  ? signalDetected
                    ? `Input signal looks ${status.signalLabel.toLowerCase()}.`
                    : 'Play a few notes to confirm Soundgarden is seeing enough input level.'
                  : 'Connect the input first, then strum to confirm signal is arriving.'
              }
              state={isConnected && signalDetected ? 'good' : 'warning'}
            />
            <ChecklistItem
              title="Latency"
              description={
                isConnected
                  ? `${status.latencyLabel} for live monitoring.`
                  : 'Latency will be measured after the input connects.'
              }
              state={status.latencyBand === 'high' ? 'warning' : 'good'}
            />
            <ChecklistItem
              title="Monitoring safety"
              description={
                monitoringSafe
                  ? monitoringEnabled
                    ? 'Monitoring is enabled at a conservative level.'
                    : 'Monitoring is muted, so Soundgarden will not feed live audio back to your speakers.'
                  : 'Volume is set fairly hot. Lower it or use headphones before monitoring through speakers.'
              }
              state={monitoringSafe ? 'good' : 'warning'}
            />
          </div>
        </div>

        <div className="space-y-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl xl:p-7">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Live status</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {isConnected ? 'Ready to play' : 'Waiting for input'}
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {isConnected
                ? `Soundgarden is monitoring ${status.inputDeviceLabel} with ${status.signalLabel.toLowerCase()} input level.`
                : 'Select an input device and connect it here before moving into tuner, effects, or recognition tools.'}
            </p>
          </div>

          {status.lastRecoverableError && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {status.lastRecoverableError}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">
              <AudioMeter />
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">
              <VolumeSlider />
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">
              <LatencyIndicator />
            </div>
          </div>

          <AudioStatusCards includeActiveMode={false} />

          <AudioDiagnosticsPanel />

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Next move</div>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {isConnected
                ? 'Jump into the tuner if you want clean input verification, or open effects if you want to shape the live signal right away.'
                : 'Use the checklist on the left to get to a connected state, then the status strip will stay visible everywhere in the app.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
