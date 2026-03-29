export function LearnStatCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-medium text-white">{value}</div>
    </div>
  )
}
