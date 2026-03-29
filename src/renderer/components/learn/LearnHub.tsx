import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Cable,
  Clock3,
  Drum,
  Ear,
  FileMusic,
  Gauge,
  Layers3,
  Music2
} from 'lucide-react'
import { PageHeader } from '../layout/PageHeader'
import { useSystemStatus } from '../../hooks/useSystemStatus'
import { useLearnProgressStore } from '../../stores/learn-progress-store'
import {
  LEARN_BROWSE_MODES,
  LEARN_FEATURES,
  LEARN_HUB_VIEWS,
  LEARN_SKILLS,
  PRACTICE_PATHS,
  buildLessonHref,
  getContinueRoute,
  getGenreProgress,
  getNextIncompleteStep,
  getPathProgress,
  getPathsForGenre,
  getPathsForSkill,
  getStarterPath,
  getVisibleGenres,
  isSetupReady
} from '../../utils/learn-data'
import type {
  GenreDefinition,
  GenreId,
  LearnBrowseMode,
  LearnHubView,
  LearnModuleId,
  LearnSkillId,
  LearnProgressEntry,
  LessonStep,
  PracticePath,
  SessionSummary
} from '../../utils/learn-types'
import { GenreCard } from './GenreCard'
import { PathCard } from './PathCard'
import { SkillMapCard } from './SkillMapCard'
import { LearnSection } from './LearnSection'

const featureIcons: Record<LearnModuleId, typeof Music2> = {
  setup: Cable,
  'scale-explorer': Music2,
  'chord-library': BookOpen,
  'rhythm-trainer': Drum,
  'ear-training': Ear,
  'chord-changes': Layers3,
  'scale-sequences': Gauge,
  'song-viewer': FileMusic
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

type LearnHubStatus = ReturnType<typeof useSystemStatus>

function formatLastPracticed(timestamp: number | null): string {
  if (!timestamp) return 'Not started'

  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function isLearnHubView(value: string | null): value is LearnHubView {
  return LEARN_HUB_VIEWS.includes(value as LearnHubView)
}

function isLearnBrowseMode(value: string | null): value is LearnBrowseMode {
  return LEARN_BROWSE_MODES.includes(value as LearnBrowseMode)
}

function isLearnSkillId(value: string | null): value is LearnSkillId {
  return LEARN_SKILLS.some((skill) => skill.id === value)
}

function OverviewView({
  lastEntry,
  continueHref,
  todaysPlan,
  visibleGenres,
  selectedGenre,
  onSelectGenre,
  onExploreAll,
  onBrowseTools,
  completedSteps,
  progress,
  status
}: {
  lastEntry: LearnProgressEntry | undefined
  continueHref: string | null
  todaysPlan: Array<{
    path: PracticePath
    nextStep: LessonStep
    summary: { completedCount: number; totalCount: number; percent: number }
  }>
  visibleGenres: GenreDefinition[]
  selectedGenre: GenreId
  onSelectGenre: (genreId: GenreId) => void
  onExploreAll: () => void
  onBrowseTools: () => void
  completedSteps: Record<string, number>
  progress: Record<string, LearnProgressEntry>
  status: LearnHubStatus
}) {
  const contextLabel = lastEntry?.lastSession?.contextLabel ?? lastEntry?.lastSession?.module ?? '—'

  return (
    <div className="flex flex-col gap-6">
      {!status.isConnected && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
          <div className="flex items-center gap-2 font-medium">
            <Cable size={16} />
            Guided audio steps will unlock once your input is connected.
          </div>
          <p className="mt-2 text-amber-50/80">
            You can still browse paths, pick starter drills, and jump into direct tools while the
            input is offline.
          </p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <LearnSection eyebrow="Continue" title="Resume where you left off">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold text-white">
                {lastEntry?.lastSession?.title ?? 'Start your first learning session'}
              </div>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                {lastEntry?.lastSession?.description ??
                  'Soundgarden will keep your last practice summary here once you start logging sessions.'}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-400">
              Last active: {formatLastPracticed(lastEntry?.lastPracticedAt ?? null)}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <InfoCard label="Context" value={contextLabel} />
            <InfoCard
              label="Best score"
              value={
                lastEntry?.bestScore === null ? '—' : `${Math.round(lastEntry?.bestScore ?? 0)}%`
              }
            />
            <InfoCard
              label="Best streak"
              value={lastEntry?.bestStreak ? String(lastEntry.bestStreak) : '—'}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {continueHref ? (
              <Link
                to={continueHref}
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
        </LearnSection>

        <LearnSection eyebrow="Today’s plan" title="Three next steps">
          <div className="space-y-3">
            {todaysPlan.map(({ path, nextStep, summary }) => {
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
        </LearnSection>
      </div>

      <LearnSection
        eyebrow="Genres"
        title="Start from a style"
        description="Pick a style to jump straight into its starter path and recommended drills."
      >
        <div className="grid gap-4 xl:grid-cols-3">
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
                onSelect={() => onSelectGenre(genre.id)}
              />
            )
          })}
        </div>
      </LearnSection>

      <LearnSection
        eyebrow="Skill snapshot"
        title="See the main practice lanes"
        description="These stay visible on the overview so you can gauge progress without opening the full catalog."
      >
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
      </LearnSection>

      <LearnSection>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-white">Need the full catalog?</div>
            <p className="mt-1 text-sm text-zinc-400">
              Explore every path when you want to browse, or open the direct tools view when you
              want quick lookup.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onExploreAll}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              Explore all paths
              <ArrowRight size={14} />
            </button>
            <button
              onClick={onBrowseTools}
              className="rounded-xl border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
            >
              Browse tools
            </button>
          </div>
        </div>
      </LearnSection>
    </div>
  )
}

function ExploreView({
  browseMode,
  selectedGenre,
  selectedSkill,
  setBrowseMode,
  setSelectedGenre,
  setSelectedSkill,
  visibleGenres,
  filteredPaths,
  pathSectionTitle,
  completedSteps,
  status
}: {
  browseMode: LearnBrowseMode
  selectedGenre: GenreId
  selectedSkill: LearnSkillId
  setBrowseMode: (mode: LearnBrowseMode) => void
  setSelectedGenre: (genreId: GenreId) => void
  setSelectedSkill: (skillId: LearnSkillId) => void
  visibleGenres: GenreDefinition[]
  filteredPaths: PracticePath[]
  pathSectionTitle: string
  completedSteps: Record<string, number>
  status: LearnHubStatus
}) {
  return (
    <LearnSection
      eyebrow="Explore"
      title={pathSectionTitle}
      description="Browse every path, filter by style or skill, and jump straight into starter drills without keeping the full catalog on the main landing page."
      actions={
        <div className="flex flex-wrap gap-2">
          {(['all', 'genre', 'skill'] as LearnBrowseMode[]).map((mode) => (
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
      }
    >
      {browseMode === 'genre' && (
        <div className="mb-5 flex flex-wrap gap-2">
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

      {browseMode === 'skill' && (
        <div className="mb-5 flex flex-wrap gap-2">
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

      <div className="grid gap-4 xl:grid-cols-3">
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
    </LearnSection>
  )
}

function ToolsView(): JSX.Element {
  return (
    <LearnSection
      eyebrow="Tools"
      title="Open a direct learning tool"
      description="Quick lookup still lives here. Use these tools to browse chords, scales, and rhythm patterns without going through a path."
    >
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {LEARN_FEATURES.map(({ to, module, title, description }) => {
          const Icon = featureIcons[module]
          return (
            <Link
              key={to}
              to={to}
              className="group flex flex-col gap-3 rounded-3xl border border-zinc-800 bg-zinc-950/50 p-6 transition-colors hover:border-emerald-600"
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
    </LearnSection>
  )
}

function InfoCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-medium text-white">{value}</div>
    </div>
  )
}

export function LearnHub(): JSX.Element {
  const status = useSystemStatus()
  const progress = useLearnProgressStore((state) => state.progress)
  const completedSteps = useLearnProgressStore((state) => state.completedSteps)
  const markStepComplete = useLearnProgressStore((state) => state.markStepComplete)
  const visibleGenres = useMemo(() => getVisibleGenres(), [])
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (!isSetupReady(status)) return
    for (const path of PRACTICE_PATHS) {
      for (const step of path.steps) {
        if (step.completionRule.type === 'setup-ready' && !completedSteps[step.id]) {
          markStepComplete(step.id)
        }
      }
    }
  }, [status, completedSteps, markStepComplete])

  const view = isLearnHubView(searchParams.get('view'))
    ? (searchParams.get('view') as LearnHubView)
    : 'overview'
  const browseMode = isLearnBrowseMode(searchParams.get('browse'))
    ? (searchParams.get('browse') as LearnBrowseMode)
    : 'all'
  const selectedGenre = visibleGenres.some((genre) => genre.id === searchParams.get('genre'))
    ? (searchParams.get('genre') as GenreId)
    : (visibleGenres[0]?.id ?? 'blues')
  const selectedSkill = isLearnSkillId(searchParams.get('skill'))
    ? (searchParams.get('skill') as LearnSkillId)
    : 'chords'

  const updateSearch = (updates: Record<string, string | null>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          next.delete(key)
          return
        }
        next.set(key, value)
      })
      return next
    })
  }

  const lastEntry = Object.values(progress)
    .filter((entry) => entry.lastPracticedAt !== null && entry.lastSession)
    .sort((a, b) => (b.lastPracticedAt ?? 0) - (a.lastPracticedAt ?? 0))[0]
  const continueHref = getContinueRoute(lastEntry?.lastSession ?? null)

  const todaysPlan = PRACTICE_PATHS.map((path) => {
    const nextStep = getNextIncompleteStep(path, completedSteps, status)
    const summary = getPathProgress(path, completedSteps, status)
    return { path, nextStep, summary }
  })
    .filter(
      (
        item
      ): item is {
        path: PracticePath
        nextStep: LessonStep
        summary: { completedCount: number; totalCount: number; percent: number }
      } => item.nextStep !== null
    )
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
        ? `${visibleGenres.find((genre) => genre.id === selectedGenre)?.title ?? 'Genre'} Paths`
        : `${LEARN_SKILLS.find((skill) => skill.id === selectedSkill)?.title ?? 'Skill'} Paths`

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Learn"
        description="Use the overview to decide what to do next, then switch to Explore or Tools when you want the full catalog."
      />

      <div className="flex flex-wrap gap-2">
        {LEARN_HUB_VIEWS.map((tab) => (
          <button
            key={tab}
            onClick={() => updateSearch({ view: tab })}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              view === tab
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {tab === 'overview' ? 'Overview' : tab === 'explore' ? 'Explore' : 'Tools'}
          </button>
        ))}
      </div>

      {view === 'overview' ? (
        <OverviewView
          lastEntry={lastEntry}
          continueHref={continueHref}
          todaysPlan={todaysPlan}
          visibleGenres={visibleGenres}
          selectedGenre={selectedGenre}
          onSelectGenre={(genreId) =>
            updateSearch({
              view: 'explore',
              browse: 'genre',
              genre: genreId
            })
          }
          onExploreAll={() =>
            updateSearch({
              view: 'explore',
              browse: 'all',
              genre: null,
              skill: null
            })
          }
          onBrowseTools={() => updateSearch({ view: 'tools' })}
          completedSteps={completedSteps}
          progress={progress}
          status={status}
        />
      ) : view === 'explore' ? (
        <ExploreView
          browseMode={browseMode}
          selectedGenre={selectedGenre}
          selectedSkill={selectedSkill}
          setBrowseMode={(mode) => updateSearch({ browse: mode })}
          setSelectedGenre={(genreId) => updateSearch({ browse: 'genre', genre: genreId })}
          setSelectedSkill={(skillId) => updateSearch({ browse: 'skill', skill: skillId })}
          visibleGenres={visibleGenres}
          filteredPaths={filteredPaths}
          pathSectionTitle={pathSectionTitle}
          completedSteps={completedSteps}
          status={status}
        />
      ) : (
        <ToolsView />
      )}
    </div>
  )
}
