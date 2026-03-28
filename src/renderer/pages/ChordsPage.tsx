import { useSystemStatus } from '../hooks/useSystemStatus'
import { ChordPanel } from '../components/chords/ChordPanel'
import { PageHeader } from '../components/layout/PageHeader'
import { AudioRequiredState } from '../components/common/AudioRequiredState'

export function ChordsPage(): JSX.Element {
  const isConnected = useSystemStatus().isConnected

  if (!isConnected) {
    return <AudioRequiredState featureName="Chord detection" />
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Chord Recognition"
        description="Strum naturally and Soundgarden will stabilise the chord name while surfacing the underlying pitch-class energy."
      />
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl">
        <ChordPanel />
      </div>
    </div>
  )
}
