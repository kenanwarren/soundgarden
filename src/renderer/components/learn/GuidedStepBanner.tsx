export function GuidedStepBanner({
  title,
  description
}: {
  title: string
  description: string
}): JSX.Element {
  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
      Guided step: <span className="font-medium text-white">{title}</span>. {description}
    </div>
  )
}
