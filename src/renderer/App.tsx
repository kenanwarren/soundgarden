import { Routes, Route, NavLink } from 'react-router-dom'
import { Cable, Guitar, GraduationCap, Home, Music, Settings, Sliders, Timer } from 'lucide-react'
import { useAudioEngineInit } from './hooks/useAudioEngine'
import { StatusStrip } from './components/layout/StatusStrip'
import { NoticeStack } from './components/layout/NoticeStack'
import { ErrorBoundary } from './components/ErrorBoundary'
import { HomePage } from './pages/HomePage'
import { TunerPage } from './pages/TunerPage'
import { EffectsPage } from './pages/EffectsPage'
import { MetronomePage } from './pages/MetronomePage'
import { ChordsPage } from './pages/ChordsPage'
import { LearnHub } from './components/learn/LearnHub'
import { ScalePanel } from './components/learn/ScalePanel'
import { ChordLibraryPanel } from './components/learn/ChordLibraryPanel'
import { RhythmPanel } from './components/learn/RhythmPanel'
import { EarTrainingPanel } from './components/learn/EarTrainingPanel'
import { ChordChangesPanel } from './components/learn/ChordChangesPanel'
import { ScaleSequencePanel } from './components/learn/ScaleSequencePanel'
import { SongViewerPanel } from './components/learn/SongViewerPanel'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { useAppSettingsStore } from './stores/app-settings-store'

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
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tuner" element={<TunerPage />} />
              <Route path="/effects" element={<EffectsPage />} />
              <Route path="/metronome" element={<MetronomePage />} />
              <Route path="/chords" element={<ChordsPage />} />
              <Route path="/learn" element={<LearnHub view="overview" />} />
              <Route path="/learn/explore" element={<LearnHub view="explore" />} />
              <Route path="/learn/tools" element={<LearnHub view="tools" />} />
              <Route path="/learn/scales" element={<ScalePanel />} />
              <Route path="/learn/chords" element={<ChordLibraryPanel />} />
              <Route path="/learn/rhythm" element={<RhythmPanel />} />
              <Route path="/learn/ear-training" element={<EarTrainingPanel />} />
              <Route path="/learn/chord-changes" element={<ChordChangesPanel />} />
              <Route path="/learn/scale-sequences" element={<ScaleSequencePanel />} />
              <Route path="/learn/songs" element={<SongViewerPanel />} />
              <Route path="/settings" element={<SettingsPanel />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
