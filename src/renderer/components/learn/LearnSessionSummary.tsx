interface LearnMetric {
  label: string
  value: string
  tone?: 'default' | 'good' | 'warning' | 'danger'
}

function toneClass(tone: LearnMetric['tone']): string {
  switch (tone) {
    case 'good':
      return 'text-emerald-300'
    case 'warning':
      return 'text-yellow-300'
    case 'danger':
      return 'text-red-300'
    default:
      return 'text-white'
  }
}

export function LearnSessionSummary({
  title,
  description,
  metrics,
  weakSpots = [],
  footer
}: {
  title: string
  description: string
  metrics: LearnMetric[]
  weakSpots?: string[]
  footer?: string
}): JSX.Element {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Session summary</div>
          <div className="mt-2 text-lg font-semibold text-white">{title}</div>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">{description}</p>
        </div>
        {footer && <div className="text-sm text-zinc-500">{footer}</div>}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3"
          >
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{metric.label}</div>
            <div className={`mt-2 text-lg font-medium ${toneClass(metric.tone)}`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {weakSpots.length > 0 && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Weak spots</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {weakSpots.map((spot) => (
              <span
                key={spot}
                className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-zinc-300"
              >
                {spot}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
