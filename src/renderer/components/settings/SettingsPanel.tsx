import { useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  Cable,
  Gauge,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Volume2
} from 'lucide-react'
import { PageHeader } from '../layout/PageHeader'
import { DeviceSelector } from '../audio/DeviceSelector'
import { VolumeSlider } from '../audio/VolumeSlider'
import { AudioMeter } from '../audio/AudioMeter'
import { LatencyIndicator } from '../audio/LatencyIndicator'
import { BpmControl } from '../common/BpmControl'
import { useAudioEngine } from '../../hooks/useAudioEngine'
import { useDevices } from '../../hooks/useDevices'
import { useSystemStatus } from '../../hooks/useSystemStatus'
import { TUNING_PRESETS } from '../../utils/constants'
import { getSignalBand, getSignalLabel } from '../../utils/system-status'
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_INTERFACE_SETTINGS,
  DEFAULT_PRACTICE_SETTINGS,
  useAppSettingsStore
} from '../../stores/app-settings-store'
import { useAudioStore } from '../../stores/audio-store'
import { useTunerStore } from '../../stores/tuner-store'
import { useMetronomeStore } from '../../stores/metronome-store'
import { useUiStore } from '../../stores/ui-store'

function Section({
  title,
  description,
  icon,
  action,
  children
}: {
  title: string
  description: string
  icon: ReactNode
  action?: ReactNode
  children: ReactNode
}): JSX.Element {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="mt-1 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-300">
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-400">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}): JSX.Element {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="mt-1 text-sm text-zinc-400">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-emerald-500"
      />
    </label>
  )
}

function StatusRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  )
}

interface CheckResult {
  tone: 'success' | 'warning'
  summary: string
  items: string[]
}

export function SettingsPanel(): JSX.Element {
  const { isConnected, inputDeviceId, connect, disconnect } = useAudioEngine()
  const { refreshDevices } = useDevices()
  const status = useSystemStatus()
  const pushNotice = useUiStore((s) => s.pushNotice)
  const audioSettings = useAppSettingsStore((s) => s.audio)
  const interfaceSettings = useAppSettingsStore((s) => s.interface)
  const setAudioSetting = useAppSettingsStore((s) => s.setAudioSetting)
  const setInterfaceSetting = useAppSettingsStore((s) => s.setInterfaceSetting)
  const resetAudioSettings = useAppSettingsStore((s) => s.resetAudioSettings)
  const resetPracticeSettings = useAppSettingsStore((s) => s.resetPracticeSettings)
  const resetInterfaceSettings = useAppSettingsStore((s) => s.resetInterfaceSettings)
  const referenceA4 = useTunerStore((s) => s.referenceA4)
  const selectedPreset = useTunerStore((s) => s.selectedPreset)
  const setReferenceA4 = useTunerStore((s) => s.setReferenceA4)
  const setPreset = useTunerStore((s) => s.setPreset)
  const hydrateTunerFromSettings = useTunerStore((s) => s.hydrateFromSettings)
  const bpm = useMetronomeStore((s) => s.bpm)
  const beatsPerMeasure = useMetronomeStore((s) => s.beatsPerMeasure)
  const accentFirst = useMetronomeStore((s) => s.accentFirst)
  const setBpm = useMetronomeStore((s) => s.setBpm)
  const setBeatsPerMeasure = useMetronomeStore((s) => s.setBeatsPerMeasure)
  const setAccentFirst = useMetronomeStore((s) => s.setAccentFirst)
  const hydrateMetronomeFromSettings = useMetronomeStore((s) => s.hydrateFromSettings)
  const notationVoice = useAppSettingsStore((s) => s.practice.notationVoice)
  const setPracticeSetting = useAppSettingsStore((s) => s.setPracticeSetting)

  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const monitoringSafe = !audioSettings.monitoringEnabled || audioSettings.masterVolume <= 0.85

  const tuningPresetEntries = useMemo(
    () => Object.entries(TUNING_PRESETS) as Array<[keyof typeof TUNING_PRESETS, string[]]>,
    []
  )

  const handleAudioReset = () => {
    resetAudioSettings()
    disconnect()
    pushNotice({
      tone: 'success',
      title: 'Audio settings reset',
      description: 'Soundgarden restored the default audio preferences.'
    })
  }

  const handlePracticeReset = () => {
    resetPracticeSettings()
    hydrateTunerFromSettings()
    hydrateMetronomeFromSettings()
    pushNotice({
      tone: 'success',
      title: 'Practice defaults reset',
      description: 'Tuner and metronome defaults are back to the stock settings.'
    })
  }

  const handleInterfaceReset = () => {
    resetInterfaceSettings()
    pushNotice({
      tone: 'success',
      title: 'Interface settings reset',
      description: 'Display preferences returned to the default layout.'
    })
  }

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
    const signalLabel = getSignalLabel(getSignalBand(audioState.inputLevel, audioState.isConnected))
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
        ? `Live audio is connected with ${signalLabel.toLowerCase()} signal.`
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
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Settings"
        description="Manage device routing, defaults, and diagnostics without digging through every tool page."
      />

      <Section
        title="Audio"
        description="Choose your preferred interface, control monitoring, and keep the app ready to reconnect."
        icon={<Cable size={18} />}
        action={
          <button
            onClick={handleAudioReset}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="space-y-4">
            <DeviceSelector />
            <div className="grid gap-3 md:grid-cols-2">
              <ToggleRow
                label="Auto reconnect"
                description="Reconnect the last input device on launch when it is still available."
                checked={audioSettings.autoReconnect}
                onChange={(checked) => setAudioSetting('autoReconnect', checked)}
              />
              <ToggleRow
                label="Monitoring"
                description="Route live input to the output device using the master volume slider."
                checked={audioSettings.monitoringEnabled}
                onChange={(checked) => setAudioSetting('monitoringEnabled', checked)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {isConnected ? (
                <button
                  onClick={disconnect}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500"
                >
                  Disconnect Input
                </button>
              ) : (
                <button
                  onClick={() => inputDeviceId && void connect(inputDeviceId)}
                  disabled={!inputDeviceId}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
                >
                  Connect Selected Input
                </button>
              )}
              <button
                onClick={() => void refreshDevices()}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
              >
                <RefreshCw size={14} />
                Refresh Devices
              </button>
            </div>
          </div>
          <div className="min-w-0 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="grid gap-3 grid-cols-1 2xl:grid-cols-3">
              <AudioMeter />
              <VolumeSlider />
              <LatencyIndicator />
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-400">
              Monitoring is{' '}
              <span className={monitoringSafe ? 'text-emerald-300' : 'text-amber-300'}>
                {monitoringSafe ? 'within a safe range' : 'set fairly hot'}
              </span>
              .{' '}
              {audioSettings.monitoringEnabled
                ? 'Use headphones or lower the volume before playing through speakers.'
                : 'Monitoring is disabled, so live input will not feed back through the output.'}
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Practice Defaults"
        description="Set the tuning and timing defaults that Soundgarden should carry across practice sessions."
        icon={<SlidersHorizontal size={18} />}
        action={
          <button
            onClick={handlePracticeReset}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <div>
              <div className="text-sm font-medium text-white">Reference Pitch</div>
              <p className="mt-1 text-sm text-zinc-400">
                Choose the A4 calibration used by the tuner.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={430}
                max={450}
                step={1}
                value={referenceA4}
                onChange={(e) => setReferenceA4(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <span className="w-20 text-right font-mono text-white">{referenceA4} Hz</span>
            </div>
            <div>
              <div className="text-sm font-medium text-white">Default Tuning Preset</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {tuningPresetEntries.map(([preset, notes]) => (
                  <button
                    key={preset}
                    onClick={() => setPreset(preset)}
                    className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                      selectedPreset === preset
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <span className="block font-medium">{preset}</span>
                    <span className="mt-1 block text-xs text-zinc-500">{notes.join(' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <div>
              <div className="text-sm font-medium text-white">Metronome Defaults</div>
              <p className="mt-1 text-sm text-zinc-400">
                Keep the standalone metronome and rhythm trainer aligned.
              </p>
            </div>
            <BpmControl bpm={bpm} setBpm={setBpm} min={40} max={220} />
            <div className="grid gap-3 md:grid-cols-[auto_1fr]">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Time Signature
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[2, 3, 4, 5, 6, 7].map((value) => (
                    <button
                      key={value}
                      onClick={() => setBeatsPerMeasure(value)}
                      className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                        beatsPerMeasure === value
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      {value}/4
                    </button>
                  ))}
                </div>
              </div>
              <ToggleRow
                label="Accent the first beat"
                description="Use a stronger click on beat one in both the metronome and rhythm trainer."
                checked={accentFirst}
                onChange={setAccentFirst}
              />
            </div>
            <div>
              <div className="text-sm font-medium text-white">Notation Playback Voice</div>
              <p className="mt-1 text-sm text-zinc-400">
                Choose the sound used when playing back song notation.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['piano', 'guitar', 'music-box', 'sine'] as const).map((voice) => (
                <button
                  key={voice}
                  onClick={() => setPracticeSetting('notationVoice', voice)}
                  className={`rounded-xl px-3 py-2 text-sm capitalize transition-colors ${
                    notationVoice === voice
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {voice === 'music-box'
                    ? 'Music Box'
                    : voice === 'sine'
                      ? 'Sine Wave'
                      : voice.charAt(0).toUpperCase() + voice.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Interface"
        description="Tweak the presentation without changing Soundgarden’s workflow or feature set."
        icon={<Volume2 size={18} />}
        action={
          <button
            onClick={handleInterfaceReset}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <ToggleRow
            label="Show tooltips"
            description="Keep hover titles on navigation and secondary controls."
            checked={interfaceSettings.showTooltips}
            onChange={(checked) => setInterfaceSetting('showTooltips', checked)}
          />
          <ToggleRow
            label="Reduced motion"
            description="Remove most animations and transition effects from the shell."
            checked={interfaceSettings.reducedMotion}
            onChange={(checked) => setInterfaceSetting('reducedMotion', checked)}
          />
          <ToggleRow
            label="Compact controls"
            description="Tighten spacing in the app shell and shared control surfaces."
            checked={interfaceSettings.compactControls}
            onChange={(checked) => setInterfaceSetting('compactControls', checked)}
          />
        </div>
      </Section>

      <Section
        title="Diagnostics"
        description="Check the current audio path, refresh device information, and verify the app is ready for a practice session."
        icon={<Activity size={18} />}
        action={
          <button
            onClick={() => void runAudioCheck()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            <Gauge size={14} />
            Run Audio Check
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatusRow label="Permission" value={status.permissionState} />
          <StatusRow label="Connection" value={status.isConnected ? 'Connected' : 'Disconnected'} />
          <StatusRow label="Signal" value={status.signalLabel} />
          <StatusRow label="Latency" value={status.latencyLabel} />
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
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-400">
          Current defaults: master volume {Math.round(audioSettings.masterVolume * 100)}%, auto
          reconnect {audioSettings.autoReconnect ? 'on' : 'off'}, monitoring{' '}
          {audioSettings.monitoringEnabled ? 'enabled' : 'disabled'}. Factory defaults are{' '}
          {Math.round(DEFAULT_AUDIO_SETTINGS.masterVolume * 100)}% volume, A4 at{' '}
          {DEFAULT_PRACTICE_SETTINGS.referenceA4} Hz, and tooltips{' '}
          {DEFAULT_INTERFACE_SETTINGS.showTooltips ? 'enabled' : 'disabled'}.
        </div>
      </Section>
    </div>
  )
}
