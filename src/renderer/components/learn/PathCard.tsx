import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Tag } from './Tag'
import { StepState } from './StepState'
import {
  LEARN_FEATURES,
  buildLessonHref,
  getStarterDrillsForPath,
  getGenreDefinition,
  getNextIncompleteStep,
  isSetupReady
} from '../../utils/learn-data'
import type { LearnStarterDrill, PracticePath } from '../../utils/learn-types'
import type { useSystemStatus } from '../../hooks/useSystemStatus'

export function PathCard({
  path,
  summary,
  nextStep,
  completedSteps,
  status
}: {
  path: PracticePath
  summary: { completedCount: number; totalCount: number; percent: number }
  nextStep: ReturnType<typeof getNextIncompleteStep>
  completedSteps: Record<string, number>
  status: ReturnType<typeof useSystemStatus>
}): JSX.Element {
  const genre = getGenreDefinition(path.genre)
  const toolLabels = path.recommendedTools
    .map((tool) => LEARN_FEATURES.find((feature) => feature.module === tool)?.title ?? tool)
    .slice(0, 3)
  const starterDrills = getStarterDrillsForPath(path).slice(0, 3)

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">{path.title}</div>
          <p className="mt-1 text-sm text-zinc-400">{path.description}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {genre && (
            <Tag label={genre.title} tone={path.genre === 'general' ? 'default' : 'accent'} />
          )}
          <Tag label={`${path.difficulty.tier} ${path.difficulty.grade}`} />
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-zinc-800">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${summary.percent}%` }}
        />
      </div>
      <div className="mt-2 text-sm text-zinc-500">
        {summary.completedCount}/{summary.totalCount} steps completed
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {path.focusSkills.map((skill) => (
          <Tag key={`${path.id}-${skill}`} label={skill} />
        ))}
      </div>

      {path.toneSuggestions?.length ? (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Tone suggestions</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {path.toneSuggestions.slice(0, 2).map((suggestion) => (
              <Tag key={`${path.id}-${suggestion}`} label={suggestion} tone="accent" />
            ))}
          </div>
        </div>
      ) : null}

      {toolLabels.length ? (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recommended tools</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {toolLabels.map((tool) => (
              <Tag key={`${path.id}-${tool}`} label={tool} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {path.steps.slice(0, 3).map((step) => (
          <StepState
            key={step.id}
            done={
              step.completionRule.type === 'setup-ready'
                ? !!completedSteps[step.id] || isSetupReady(status)
                : !!completedSteps[step.id]
            }
            label={step.title}
          />
        ))}
      </div>

      <div className="mt-4">
        {nextStep ? (
          <Link
            to={buildLessonHref(nextStep)}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-emerald-500/40 hover:text-white"
          >
            Next: {nextStep.title}
            <ArrowRight size={14} />
          </Link>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            <CheckCircle2 size={14} />
            Path complete
          </div>
        )}
      </div>

      {starterDrills.length > 0 && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Starter drills</div>
          <div className="mt-2 flex flex-col gap-2">
            {starterDrills.map((drill) => (
              <StarterDrillLink key={drill.id} drill={drill} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StarterDrillLink({ drill }: { drill: LearnStarterDrill }): JSX.Element {
  return (
    <Link
      to={drill.href}
      className="group rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 transition-colors hover:border-emerald-500/40 hover:bg-zinc-950"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">{drill.title}</div>
          <p className="mt-1 text-xs leading-5 text-zinc-400">{drill.description}</p>
        </div>
        <ArrowRight
          size={14}
          className="mt-1 text-zinc-500 transition-colors group-hover:text-emerald-300"
        />
      </div>
    </Link>
  )
}
