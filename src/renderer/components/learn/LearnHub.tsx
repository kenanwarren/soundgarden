import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Cable,
  Clock3,
  Drum,
  Ear,
  Gauge,
  Layers3,
  Music2
} from 'lucide-react'
import { PageHeader } from '../layout/PageHeader'
import { useSystemStatus } from '../../hooks/useSystemStatus'
import { useLearnProgressStore } from '../../stores/learn-progress-store'
import {
  LEARN_FEATURES,
  LEARN_SKILLS,
  PRACTICE_PATHS,
  buildLessonHref,
  getGenreProgress,
  getNextIncompleteStep,
  getPathProgress,
  getPathsForGenre,
  getPathsForSkill,
  getStarterPath,
  getVisibleGenres,
  isSetupReady
} from '../../utils/learn-data'
import type { GenreId, LearnModuleId, LearnSkillId } from '../../utils/learn-types'
import { Tag } from './Tag'
import { SkillMapCard } from './SkillMapCard'
import { GenreCard } from './GenreCard'
import { PathCard } from './PathCard'

const featureIcons: Record<LearnModuleId, typeof Music2> = {
  setup: Cable,
  'scale-explorer': Music2,
  'chord-library': BookOpen,
  'rhythm-trainer': Drum,
  'ear-training': Ear,
  'chord-changes': Layers3,
  'scale-sequences': Gauge
}

const skillCards: Array<{ module: LearnModuleId; title: string; description: string }> = [
  {
    module: 'scale-explorer',
    title: 'Scales',
    description: 'Scale maps, note coverage, and ordered pattern work.'
  },
  {
    module: 'chord-library',
    title: 'Chords',
    description: 'Voicings, clean matches, and transition readiness.'
  },
  {
    module: 'rhythm-trainer',
    title: 'Rhythm',
    description: 'Accuracy, timing tendency, and streak consistency.'
  },
  {
    module: 'ear-training',
    title: 'Ear',
    description: 'Note recall, interval recall, and listening accuracy.'
  }
]

function formatLastPracticed(timestamp: number | null): string {
  if (!timestamp) return 'Not started'

  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function LearnHub(): JSX.Element {
  const status = useSystemStatus()
  const progress = useLearnProgressStore((state) => state.progress)
  const completedSteps = useLearnProgressStore((state) => state.completedSteps)
  const visibleGenres = useMemo(() => getVisibleGenres(), [])
  const [browseMode, setBrowseMode] = useState<'all' | 'genre' | 'skill'>('all')
  const [selectedGenre, setSelectedGenre] = useState<GenreId>(visibleGenres[0]?.id ?? 'blues')
  const [selectedSkill, setSelectedSkill] = useState<LearnSkillId>('chords')

  const lastEntry = Object.values(progress)
    .filter((entry) => entry.lastPracticedAt !== null && entry.lastSession)
    .sort((a, b) => (b.lastPracticedAt ?? 0) - (a.lastPracticedAt ?? 0))[0]

  const todaysPlan = PRACTICE_PATHS.map((path) => {
    const nextStep = getNextIncompleteStep(path, completedSteps, status)
    const summary = getPathProgress(path, completedSteps, status)
    return { path, nextStep, summary }
  })
    .filter((item) => item.nextStep)
    .slice(0, 3)

  const filteredPaths =
    browseMode === 'all'
      ? PRACTICE_PATHS
      : browseMode === 'genre'
        ? getPathsForGenre(selectedGenre)
        : getPathsForSkill(selectedSkill)

  const pathSectionTitle =
    browseMode === 'all'
      ? 'All Learning Paths'
      : browseMode === 'genre'
        ? `${visibleGenres.find((g) => g.id === selectedGenre)?.title ?? 'Genre'} Paths`
        : `${LEARN_SKILLS.find((skill) => skill.id === selectedSkill)?.title ?? 'Skill'} Paths`

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Learn"
        description="Follow guided paths, browse by genre or skill, and keep the practice tools connected to a shared long-term progress view."
      />

      {!status.isConnected && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
          <div className="flex items-center gap-2 font-medium">
            <Cable size={16} />
            Guided audio steps will unlock once your input is connected.
          </div>
          <p className="mt-2 text-amber-50/80">
            You can still browse genre paths, review skill gaps, and open scale or chord content
            while the input is offline.
          </p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Continue practicing
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {lastEntry?.lastSession?.title ?? 'Start your first learning session'}
              </div>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                {lastEntry?.lastSession?.description ??
                  'The dashboard will keep your last practice summary here once you start logging sessions.'}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-400">
              Last active: {formatLastPracticed(lastEntry?.lastPracticedAt ?? null)}
            </div>
          </div>

          {lastEntry?.lastSession ? (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Module</div>
                <div className="mt-2 text-lg font-medium text-white">
                  {lastEntry.lastSession.module}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Best score</div>
                <div className="mt-2 text-lg font-medium text-white">
                  {lastEntry.bestScore === null ? '—' : `${Math.round(lastEntry.bestScore)}%`}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Best streak</div>
                <div className="mt-2 text-lg font-medium text-white">
                  {lastEntry.bestStreak ?? '—'}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            {lastEntry?.lastSession ? (
              <Link
                to={lastEntry.lastSession.route}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                Continue
                <ArrowRight size={14} />
              </Link>
            ) : (
              <Link
                to="/learn/scales"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
              >
                Start with scales
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Today&apos;s plan</div>
          <div className="mt-2 text-2xl font-semibold text-white">Three next steps</div>
          <div className="mt-4 space-y-3">
            {todaysPlan.map(({ path, nextStep, summary }) => {
              if (!nextStep) return null
              const blocked = nextStep.audioRequired && !status.isConnected
              return (
                <div
                  key={nextStep.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-white">{nextStep.title}</div>
                      <p className="mt-1 text-sm text-zinc-400">{nextStep.description}</p>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                        {path.title} · {summary.percent}% complete
                      </div>
                    </div>
                    {blocked ? (
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
                        Connect input
                      </span>
                    ) : (
                      <Link
                        to={buildLessonHref(nextStep)}
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-emerald-500/40 hover:text-white"
                      >
                        Open
                        <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Genre browser</div>
            <div className="mt-2 text-2xl font-semibold text-white">Start from a style</div>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">
              Genre cards aggregate progress across their starter paths and surface lightweight tone
              guidance without hiding the direct tools.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'genre', 'skill'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setBrowseMode(mode)}
                className={`rounded-xl px-3 py-2 text-sm capitalize transition-colors ${
                  browseMode === mode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {mode === 'all' ? 'All paths' : mode === 'genre' ? 'By genre' : 'By skill'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {visibleGenres.map((genre) => {
            const starterPath = getStarterPath(genre.id)
            const nextStep = starterPath
              ? getNextIncompleteStep(starterPath, completedSteps, status)
              : null
            const progressSummary = getGenreProgress(genre.id, completedSteps, status)

            return (
              <GenreCard
                key={genre.id}
                genre={genre}
                percent={progressSummary.percent}
                starterPath={starterPath}
                nextStep={nextStep}
                isSelected={selectedGenre === genre.id}
                onSelect={() => {
                  setSelectedGenre(genre.id)
                  setBrowseMode('genre')
                }}
              />
            )
          })}
        </div>

        {browseMode === 'skill' && (
          <div className="mt-5 flex flex-wrap gap-2">
            {LEARN_SKILLS.map((skill) => (
              <button
                key={skill.id}
                onClick={() => setSelectedSkill(skill.id)}
                className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                  selectedSkill === skill.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {skill.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Path library</div>
            <div className="mt-2 text-2xl font-semibold text-white">{pathSectionTitle}</div>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">
              Browse every path, narrow by style, or pivot around a skill focus without losing the
              direct tools below.
            </p>
          </div>
          {browseMode === 'genre' && (
            <div className="flex flex-wrap gap-2">
              {visibleGenres.map((genre) => (
                <button
                  key={`filter-${genre.id}`}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                    selectedGenre === genre.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {genre.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {filteredPaths.map((path) => {
            const summary = getPathProgress(path, completedSteps, status)
            const nextStep = getNextIncompleteStep(path, completedSteps, status)
            return (
              <PathCard
                key={path.id}
                path={path}
                summary={summary}
                nextStep={nextStep}
                completedSteps={completedSteps}
                status={status}
              />
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {skillCards.map(({ module, title, description }) => (
          <SkillMapCard
            key={module}
            title={title}
            description={description}
            entry={progress[module]}
          />
        ))}
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
          <Clock3 size={14} />
          Tools
        </div>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Quick lookup still lives here. Use these tools to browse chords, scales, and rhythm
          patterns directly without stepping into a genre path.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {LEARN_FEATURES.map(({ to, module, title, description }) => {
            const Icon = featureIcons[module]
            return (
              <Link
                key={to}
                to={to}
                className="group flex flex-col gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 transition-colors hover:border-emerald-600"
              >
                <Icon
                  size={28}
                  className="text-emerald-500 transition-colors group-hover:text-emerald-400"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
