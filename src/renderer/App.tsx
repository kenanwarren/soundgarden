import { Routes, Route, NavLink, Link } from 'react-router-dom'
import {
  Cable,
  CheckCircle2,
  CircleAlert,
  Guitar,
  GraduationCap,
  Home,
  Music,
  Power,
  Settings,
  Sliders,
  Timer
} from 'lucide-react'
import { useAudioEngine, useAudioEngineInit } from './hooks/useAudioEngine'
import { useDevices } from './hooks/useDevices'
import { useTuner } from './hooks/useTuner'
import { useSystemStatus } from './hooks/useSystemStatus'
import { DeviceSelector } from './components/audio/DeviceSelector'
import { AudioMeter } from './components/audio/AudioMeter'
import { LatencyIndicator } from './components/audio/LatencyIndicator'
import { VolumeSlider } from './components/audio/VolumeSlider'
import { TunerDisplay } from './components/tuner/TunerDisplay'
import { TunerSettings } from './components/tuner/TunerSettings'
import { EffectsChainPanel } from './components/effects/EffectsChain'
import { MetronomePanel } from './components/metronome/MetronomePanel'
import { ChordPanel } from './components/chords/ChordPanel'
import { LearnHub } from './components/learn/LearnHub'
import { ScalePanel } from './components/learn/ScalePanel'
import { ChordLibraryPanel } from './components/learn/ChordLibraryPanel'
import { RhythmPanel } from './components/learn/RhythmPanel'
import { EarTrainingPanel } from './components/learn/EarTrainingPanel'
import { ChordChangesPanel } from './components/learn/ChordChangesPanel'
import { ScaleSequencePanel } from './components/learn/ScaleSequencePanel'
import { PageHeader } from './components/layout/PageHeader'
import { StatusStrip } from './components/layout/StatusStrip'
import { NoticeStack } from './components/layout/NoticeStack'
import { AudioRequiredState } from './components/common/AudioRequiredState'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { useAppSettingsStore } from './stores/app-settings-store'

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

function HomePage(): JSX.Element {
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

function TunerPage(): JSX.Element {
  const { isActive, startTuner, stopTuner, isConnected } = useTuner()

  if (!isConnected) {
    return <AudioRequiredState featureName="The tuner" />
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Tuner"
        description="Use the selected tuning preset to keep a target set of strings in view while Soundgarden listens for a stable pitch."
        actions={
          <button
            onClick={isActive ? stopTuner : () => void startTuner()}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isActive ? 'Stop Tuner' : 'Start Tuner'}
          </button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl">
          <TunerDisplay />
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl">
          <TunerSettings />
        </div>
      </div>
    </div>
  )
}

function EffectsPage(): JSX.Element {
  const isConnected = useSystemStatus().isConnected

  if (!isConnected) {
    return <AudioRequiredState featureName="The effects chain" />
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Effects"
        description="Build a live chain, search by effect type, and drag pedals into the order that matches your rig."
      />
      <EffectsChainPanel />
    </div>
  )
}

function MetronomePage(): JSX.Element {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Metronome"
        description="The metronome and rhythm trainer now share the same tempo defaults, labels, and feel."
      />
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl">
        <MetronomePanel />
      </div>
    </div>
  )
}

function ChordsPage(): JSX.Element {
  const isConnected = useSystemStatus().isConnected

  if (!isConnected) {
    return <AudioRequiredState featureName="Chord detection" />
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Chord Recognition"
        description="Strum naturally and Soundgarden will stabilise the chord name while surfacing the underlying pitch-class energy."
      />
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl">
        <ChordPanel />
      </div>
    </div>
  )
}

function SettingsPage(): JSX.Element {
  return <SettingsPanel />
}

const navItems = [
  { to: '/', icon: Home, label: 'Setup', description: 'Devices, checklist, live status' },
  { to: '/tuner', icon: Guitar, label: 'Tuner', description: 'Pitch and target tuning' },
  { to: '/effects', icon: Sliders, label: 'Effects', description: 'Pedals and chain order' },
  { to: '/metronome', icon: Timer, label: 'Metronome', description: 'Tempo and pulse' },
  { to: '/chords', icon: Music, label: 'Chords', description: 'Recognition and note energy' },
  { to: '/learn', icon: GraduationCap, label: 'Learn', description: 'Guided practice tools' },
  { to: '/settings', icon: Settings, label: 'Settings', description: 'Defaults and diagnostics' }
]

export default function App(): JSX.Element {
  useAudioEngineInit()

  const reducedMotion = useAppSettingsStore((s) => s.interface.reducedMotion)
  const compactControls = useAppSettingsStore((s) => s.interface.compactControls)
  const showTooltips = useAppSettingsStore((s) => s.interface.showTooltips)

  return (
    <div className={`flex h-screen bg-zinc-950 text-white ${reducedMotion ? 'reduce-motion' : ''}`}>
      <NoticeStack />
      <aside
        className={`hidden border-r border-zinc-800 bg-zinc-950/95 lg:flex lg:flex-col ${
          compactControls ? 'w-64 px-3 py-4' : 'w-72 px-4 py-5'
        }`}
      >
        <div className="mb-6 rounded-3xl border border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_55%),linear-gradient(180deg,_rgba(39,39,42,0.95),_rgba(9,9,11,0.95))] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-200">
              <Cable size={18} />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-white">Soundgarden</div>
              <p className="mt-1 text-sm text-zinc-400">
                Desktop guitar practice with live audio feedback.
              </p>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map(({ to, icon: Icon, label, description }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                  isActive
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-white'
                    : 'border-transparent text-zinc-300 hover:border-zinc-800 hover:bg-zinc-900/80 hover:text-white'
                }`
              }
              title={showTooltips ? `${label}: ${description}` : undefined}
            >
              <div className="rounded-xl border border-current/10 bg-black/10 p-2">
                <Icon size={18} />
              </div>
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-zinc-500 transition-colors group-hover:text-zinc-400">
                  {description}
                </div>
              </div>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.06),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,_rgba(12,12,14,1),_rgba(9,9,11,1))]">
        <div className="border-b border-zinc-800 bg-zinc-950/90 px-3 py-2 lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-white'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white'
                  }`
                }
                title={showTooltips ? label : undefined}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
        <StatusStrip />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tuner" element={<TunerPage />} />
            <Route path="/effects" element={<EffectsPage />} />
            <Route path="/metronome" element={<MetronomePage />} />
            <Route path="/chords" element={<ChordsPage />} />
            <Route path="/learn" element={<LearnHub />} />
            <Route path="/learn/scales" element={<ScalePanel />} />
            <Route path="/learn/chords" element={<ChordLibraryPanel />} />
            <Route path="/learn/rhythm" element={<RhythmPanel />} />
            <Route path="/learn/ear-training" element={<EarTrainingPanel />} />
            <Route path="/learn/chord-changes" element={<ChordChangesPanel />} />
            <Route path="/learn/scale-sequences" element={<ScaleSequencePanel />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
