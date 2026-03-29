import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Cable, RotateCcw, SlidersHorizontal, Volume2 } from 'lucide-react'
import { PageHeader } from '../layout/PageHeader'
import { AudioStatusCards } from '../audio/AudioStatusCards'
import { BpmControl } from '../common/BpmControl'
import { useAudioEngine } from '../../hooks/useAudioEngine'
import { TUNING_PRESETS } from '../../utils/constants'
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_INTERFACE_SETTINGS,
  DEFAULT_PRACTICE_SETTINGS,
  useAppSettingsStore
} from '../../stores/app-settings-store'
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

export function SettingsPanel(): JSX.Element {
  const { disconnect } = useAudioEngine()
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

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Settings"
        description="Manage persistent preferences and defaults. Live routing, device selection, and diagnostics now live on Setup."
      />

      <Section
        title="Audio"
        description="Set the persistent audio preferences Soundgarden should keep between sessions."
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
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 text-sm text-zinc-400">
              Resetting audio preferences clears saved routing and returns monitoring defaults to
              the stock state. The live engine disconnects so Setup can apply a fresh route.
            </div>
          </div>
          <div className="min-w-0 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <div>
              <div className="text-sm font-medium text-white">Current runtime snapshot</div>
              <p className="mt-1 text-sm text-zinc-400">
                Setup owns device routing and diagnostics. This panel stays focused on defaults and
                shows only a compact runtime summary.
              </p>
            </div>
            <AudioStatusCards includeActiveMode={false} includeSampleRate={true} />
            <div className="flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                Open Setup
              </Link>
              <button
                onClick={disconnect}
                className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
              >
                Disconnect Input
              </button>
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
    </div>
  )
}
