import { Link } from 'react-router-dom'
import { Music2, BookOpen, Drum, Ear } from 'lucide-react'

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
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
      <h2 className="text-2xl font-bold text-white">Learn</h2>
      <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
        {features.map(({ to, icon: Icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col gap-3 p-6 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-emerald-600 transition-colors group"
          >
            <Icon size={28} className="text-emerald-500 group-hover:text-emerald-400 transition-colors" />
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-zinc-400 mt-1">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
