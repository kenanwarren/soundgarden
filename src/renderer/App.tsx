import { Routes, Route, NavLink } from 'react-router-dom'
import { Home, Guitar, Sliders, Settings, Power, Timer, Music, GraduationCap } from 'lucide-react'
import { useAudioEngine, useAudioEngineInit } from './hooks/useAudioEngine'
import { useDevices } from './hooks/useDevices'
import { useTuner } from './hooks/useTuner'
import { DeviceSelector } from './components/audio/DeviceSelector'
import { AudioMeter } from './components/audio/AudioMeter'
import { LatencyIndicator } from './components/audio/LatencyIndicator'
import { VolumeSlider } from './components/audio/VolumeSlider'
import { TunerDisplay } from './components/tuner/TunerDisplay'
import { TunerSettings } from './components/tuner/TunerSettings'
import { EffectsChainPanel } from './components/effects/EffectsChain'
import { MetronomePanel } from './components/metronome/MetronomePanel'
import { ChordPanel } from './components/chords/ChordPanel'
import { useAudioStore } from './stores/audio-store'
import { LearnHub } from './components/learn/LearnHub'
import { ScalePanel } from './components/learn/ScalePanel'
import { ChordLibraryPanel } from './components/learn/ChordLibraryPanel'
import { RhythmPanel } from './components/learn/RhythmPanel'
import { EarTrainingPanel } from './components/learn/EarTrainingPanel'

function HomePage(): JSX.Element {
  const { isConnected, connect, disconnect } = useAudioEngine()
  const { inputDeviceId } = useDevices()

  const handleToggle = () => {
    if (isConnected) {
      disconnect()
    } else if (inputDeviceId) {
      connect(inputDeviceId)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
      <h1 className="text-4xl font-bold text-white">ToneField</h1>
      <p className="text-zinc-400 text-lg">Plug in your guitar and start playing</p>

      <DeviceSelector />

      <div className="flex items-center gap-8">
        <button
          onClick={handleToggle}
          disabled={!inputDeviceId && !isConnected}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isConnected
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
              : inputDeviceId
                ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          <Power size={24} />
        </button>

        <AudioMeter />
        <VolumeSlider />
        <LatencyIndicator />
      </div>

      <p className="text-xs text-zinc-600">
        {isConnected
          ? 'Audio connected — playing through'
          : 'Select an input device and press the button to connect'}
      </p>
    </div>
  )
}

function TunerPage(): JSX.Element {
  const { isActive, startTuner, stopTuner, isConnected } = useTuner()

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
      <h2 className="text-2xl font-bold text-white">Tuner</h2>

      {!isConnected ? (
        <p className="text-zinc-400">Connect your audio input on the Home page first</p>
      ) : (
        <>
          <button
            onClick={isActive ? stopTuner : startTuner}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isActive
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-zinc-700 hover:bg-zinc-600 text-white'
            }`}
          >
            {isActive ? 'Stop Tuner' : 'Start Tuner'}
          </button>

          <TunerDisplay />
          <TunerSettings />
        </>
      )}
    </div>
  )
}

function EffectsPage(): JSX.Element {
  const isConnected = useAudioStore((s) => s.isConnected)

  return (
    <div className="flex flex-col h-full p-8 gap-6">
      <h2 className="text-2xl font-bold text-white">Effects</h2>

      {!isConnected ? (
        <p className="text-zinc-400">Connect your audio input on the Home page first</p>
      ) : (
        <EffectsChainPanel />
      )}
    </div>
  )
}

function MetronomePage(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
      <h2 className="text-2xl font-bold text-white">Metronome</h2>
      <MetronomePanel />
    </div>
  )
}

function ChordsPage(): JSX.Element {
  const isConnected = useAudioStore((s) => s.isConnected)

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
      <h2 className="text-2xl font-bold text-white">Chord Recognition</h2>

      {!isConnected ? (
        <p className="text-zinc-400">Connect your audio input on the Home page first</p>
      ) : (
        <ChordPanel />
      )}
    </div>
  )
}

function SettingsPage(): JSX.Element {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-zinc-400">Settings coming soon</p>
    </div>
  )
}

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/tuner', icon: Guitar, label: 'Tuner' },
  { to: '/effects', icon: Sliders, label: 'Effects' },
  { to: '/metronome', icon: Timer, label: 'Metronome' },
  { to: '/chords', icon: Music, label: 'Chords' },
  { to: '/learn', icon: GraduationCap, label: 'Learn' },
  { to: '/settings', icon: Settings, label: 'Settings' }
]

export default function App(): JSX.Element {
  useAudioEngineInit()

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <nav className="w-16 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 gap-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`
            }
            title={label}
          >
            <Icon size={20} />
          </NavLink>
        ))}
      </nav>
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
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}
