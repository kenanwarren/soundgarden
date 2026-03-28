import { useTuner } from '../hooks/useTuner'
import { TunerDisplay } from '../components/tuner/TunerDisplay'
import { TunerSettings } from '../components/tuner/TunerSettings'
import { PageHeader } from '../components/layout/PageHeader'
import { AudioRequiredState } from '../components/common/AudioRequiredState'

export function TunerPage(): JSX.Element {
  const { isActive, startTuner, stopTuner, isConnected } = useTuner()

  if (!isConnected) {
    return <AudioRequiredState featureName="The tuner" />
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Tuner"
        description="Use the selected tuning preset to keep a target set of strings in view while Soundgarden listens for a stable pitch."
        actions={
          <button
            onClick={isActive ? stopTuner : () => void startTuner()}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isActive ? 'Stop Tuner' : 'Start Tuner'}
          </button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl">
          <TunerDisplay />
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl">
          <TunerSettings />
        </div>
      </div>
    </div>
  )
}
