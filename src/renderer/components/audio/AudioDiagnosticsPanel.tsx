import { useState } from 'react'
import { Gauge } from 'lucide-react'
import { useDevices } from '../../hooks/useDevices'
import { useSystemStatus } from '../../hooks/useSystemStatus'
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_INTERFACE_SETTINGS,
  DEFAULT_PRACTICE_SETTINGS,
  useAppSettingsStore
} from '../../stores/app-settings-store'
import { useAudioStore } from '../../stores/audio-store'
import { useUiStore } from '../../stores/ui-store'

interface CheckResult {
  tone: 'success' | 'warning'
  summary: string
  items: string[]
}

export function AudioDiagnosticsPanel(): JSX.Element {
  const { refreshDevices } = useDevices()
  const status = useSystemStatus()
  const pushNotice = useUiStore((s) => s.pushNotice)
  const audioSettings = useAppSettingsStore((s) => s.audio)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)

  const runAudioCheck = async () => {
    await refreshDevices()

    const audioState = useAudioStore.getState()
    const latestAudioSettings = useAppSettingsStore.getState().audio
    const inputLabel =
      audioState.inputDevices.find((device) => device.id === latestAudioSettings.inputDeviceId)
        ?.label ?? 'No input selected'
    const outputLabel =
      audioState.outputDevices.find((device) => device.id === latestAudioSettings.outputDeviceId)
        ?.label ?? 'Default output'
    const safeMonitoring =
      !latestAudioSettings.monitoringEnabled || latestAudioSettings.masterVolume <= 0.85
    const items: string[] = []

    if (audioState.permissionState === 'denied') {
      items.push('Microphone permission is blocked.')
    } else {
      items.push('Microphone permission is available.')
    }

    items.push(
      latestAudioSettings.inputDeviceId
        ? `Input route: ${inputLabel}.`
        : 'No input device is selected.'
    )
    items.push(`Output route: ${outputLabel}.`)
    items.push(
      audioState.isConnected
        ? `Live audio is connected with ${status.signalLabel.toLowerCase()} signal.`
        : 'Live audio is not connected.'
    )
    items.push(
      safeMonitoring
        ? 'Monitoring level looks safe for a quick check.'
        : 'Monitoring volume is high. Lower it before playing back through speakers.'
    )

    const tone: CheckResult['tone'] =
      audioState.permissionState === 'denied' || !latestAudioSettings.inputDeviceId
        ? 'warning'
        : 'success'
    const summary =
      tone === 'success'
        ? 'Audio check passed. Soundgarden is ready for live input.'
        : 'Audio check found a few setup issues to resolve.'

    setCheckResult({ tone, summary, items })
    pushNotice({
      tone,
      title: tone === 'success' ? 'Audio check passed' : 'Audio check found issues',
      description: summary
    })
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Diagnostics</div>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Run a quick check after device changes to verify routing, permission, and monitoring.
          </p>
        </div>
        <button
          onClick={() => void runAudioCheck()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
        >
          <Gauge size={14} />
          Run Audio Check
        </button>
      </div>

      {checkResult && (
        <div
          className={`mt-4 rounded-2xl border px-4 py-4 ${
            checkResult.tone === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-amber-500/30 bg-amber-500/10'
          }`}
        >
          <div className="text-sm font-medium text-white">{checkResult.summary}</div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {checkResult.items.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-zinc-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-sm text-zinc-400">
        Current defaults: master volume {Math.round(audioSettings.masterVolume * 100)}%, auto
        reconnect {audioSettings.autoReconnect ? 'on' : 'off'}, monitoring{' '}
        {audioSettings.monitoringEnabled ? 'enabled' : 'disabled'}. Factory defaults are{' '}
        {Math.round(DEFAULT_AUDIO_SETTINGS.masterVolume * 100)}% volume, A4 at{' '}
        {DEFAULT_PRACTICE_SETTINGS.referenceA4} Hz, and tooltips{' '}
        {DEFAULT_INTERFACE_SETTINGS.showTooltips ? 'enabled' : 'disabled'}.
      </div>
    </section>
  )
}
