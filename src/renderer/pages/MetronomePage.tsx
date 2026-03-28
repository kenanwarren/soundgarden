import { MetronomePanel } from '../components/metronome/MetronomePanel'
import { PageHeader } from '../components/layout/PageHeader'

export function MetronomePage(): JSX.Element {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Metronome"
        description="The metronome and rhythm trainer now share the same tempo defaults, labels, and feel."
      />
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl">
        <MetronomePanel />
      </div>
    </div>
  )
}
