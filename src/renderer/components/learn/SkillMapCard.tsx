import { Tag } from './Tag'
import { getModuleProgressValue } from '../../utils/learn-data'
import type { LearnProgressEntry } from '../../utils/learn-types'

function progressTone(value: number): string {
  if (value >= 100) return 'bg-emerald-500'
  if (value >= 55) return 'bg-sky-500'
  if (value > 0) return 'bg-yellow-500'
  return 'bg-zinc-700'
}

export function SkillMapCard({
  title,
  description,
  entry
}: {
  title: string
  description: string
  entry?: LearnProgressEntry
}): JSX.Element {
  const value = getModuleProgressValue(entry)

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">{title}</div>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        </div>
        <div className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-zinc-300">
          {value}%
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-zinc-800">
        <div
          className={`h-2 rounded-full transition-all ${progressTone(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Attempts</div>
          <div className="mt-2 text-lg font-medium text-white">{entry?.attempts ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Best score</div>
          <div className="mt-2 text-lg font-medium text-white">
            {entry?.bestScore === null || entry?.bestScore === undefined
              ? '—'
              : `${Math.round(entry.bestScore)}%`}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Best streak</div>
          <div className="mt-2 text-lg font-medium text-white">{entry?.bestStreak ?? '—'}</div>
        </div>
      </div>

      {entry?.weakSpots.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {entry.weakSpots.slice(0, 3).map((spot) => (
            <Tag key={spot} label={spot} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">
          No weak spots logged yet. Start a session to populate this map.
        </p>
      )}
    </div>
  )
}
