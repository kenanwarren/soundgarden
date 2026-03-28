export function Tag({
  label,
  tone = 'default'
}: {
  label: string
  tone?: 'default' | 'accent'
}): JSX.Element {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs ${
        tone === 'accent'
          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
          : 'border border-zinc-700 bg-zinc-950 text-zinc-300'
      }`}
    >
      {label}
    </span>
  )
}
