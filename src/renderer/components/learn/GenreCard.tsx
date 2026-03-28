import { Tag } from './Tag'
import type { GenreDefinition, PracticePath } from '../../utils/learn-types'
import type { getNextIncompleteStep } from '../../utils/learn-data'

function progressTone(value: number): string {
  if (value >= 100) return 'bg-emerald-500'
  if (value >= 55) return 'bg-sky-500'
  if (value > 0) return 'bg-yellow-500'
  return 'bg-zinc-700'
}

export function GenreCard({
  genre,
  percent,
  starterPath,
  nextStep,
  isSelected,
  onSelect
}: {
  genre: GenreDefinition
  percent: number
  starterPath?: PracticePath
  nextStep?: ReturnType<typeof getNextIncompleteStep>
  isSelected: boolean
  onSelect: () => void
}): JSX.Element {
  return (
    <button
      onClick={onSelect}
      className={`rounded-3xl border p-5 text-left transition-colors ${
        isSelected
          ? 'border-emerald-400/60 bg-emerald-600/10'
          : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 hover:bg-zinc-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">{genre.title}</div>
          <p className="mt-1 text-sm text-zinc-400">{genre.shortSummary}</p>
        </div>
        <div className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-zinc-300">
          {percent}%
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-zinc-800">
        <div
          className={`h-2 rounded-full transition-all ${progressTone(percent)}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {genre.focusSkills.slice(0, 3).map((skill) => (
          <Tag key={skill} label={skill} />
        ))}
      </div>

      <div className="mt-4 text-sm text-zinc-400">{genre.description}</div>

      {genre.toneSuggestions.length > 0 && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Starter tones</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {genre.toneSuggestions.slice(0, 2).map((suggestion) => (
              <Tag key={suggestion} label={suggestion} tone="accent" />
            ))}
          </div>
        </div>
      )}

      {starterPath && nextStep && (
        <div className="mt-4 text-sm text-zinc-300">
          Start here: <span className="font-medium text-white">{starterPath.title}</span> ·{' '}
          {nextStep.title}
        </div>
      )}
    </button>
  )
}
