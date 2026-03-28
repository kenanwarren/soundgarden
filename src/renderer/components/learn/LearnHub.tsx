import { Link } from 'react-router-dom'
import { BookOpen, Cable, Drum, Ear, Music2 } from 'lucide-react'
import { PageHeader } from '../layout/PageHeader'
import { useSystemStatus } from '../../hooks/useSystemStatus'

const features = [
  {
    to: '/learn/scales',
    icon: Music2,
    title: 'Scale Explorer',
    description: 'Browse scales and practice with real-time pitch detection'
  },
  {
    to: '/learn/chords',
    icon: BookOpen,
    title: 'Chord Library',
    description: 'Fingering diagrams and chord practice'
  },
  {
    to: '/learn/rhythm',
    icon: Drum,
    title: 'Rhythm Trainer',
    description: 'Practice timing with rhythm patterns and the metronome'
  },
  {
    to: '/learn/ear-training',
    icon: Ear,
    title: 'Ear Training',
    description: 'Identify notes and intervals by ear'
  }
]

export function LearnHub(): JSX.Element {
  const status = useSystemStatus()

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Learn"
        description="Pick a focused practice mode, then use the shared setup status at the top of the app to keep input, signal, and latency under control."
      />

      {!status.isConnected && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
          <div className="flex items-center gap-2 font-medium">
            <Cable size={16} />
            Live practice tools work best once your input is connected.
          </div>
          <p className="mt-2 text-amber-50/80">
            You can still browse scales and chord shapes now, but rhythm tracking, ear-response
            listening, and pitch-based practice need a live input.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {features.map(({ to, icon: Icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 transition-colors hover:border-emerald-600"
          >
            <Icon
              size={28}
              className="text-emerald-500 group-hover:text-emerald-400 transition-colors"
            />
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
