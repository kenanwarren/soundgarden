import { Ear, Play, RotateCcw } from 'lucide-react'
import { useEarTrainingStore } from '../../stores/ear-training-store'
import { useEarTraining } from '../../hooks/useEarTraining'
import { PageHeader } from '../layout/PageHeader'
import { AudioRequiredState } from '../common/AudioRequiredState'

const MODES = [
  {
    value: 'note' as const,
    label: 'Note',
    description: 'Hear one pitch, then match it back on the guitar.'
  },
  {
    value: 'interval' as const,
    label: 'Interval',
    description: 'Hear two tones, then play back the second note.'
  }
]

function SummaryCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-medium text-white">{value}</div>
    </div>
  )
}

export function EarTrainingPanel(): JSX.Element {
  const { mode, currentChallenge, isListening, score, streak, total, lastResult, setMode, reset } =
    useEarTrainingStore()
  const { newRound, playChallenge, listen, stopListening, isConnected } = useEarTraining()

  const accuracy = total > 0 ? Math.round((score / total) * 100) : null

  if (!isConnected) {
    return <AudioRequiredState featureName="Ear training" />
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <PageHeader
        title="Ear Training"
        description="Replay the prompt as often as you need, then switch into listening mode and let Soundgarden judge the response."
        backTo="/learn"
        actions={
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <RotateCcw size={14} />
            Reset Score
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Correct" value={String(score)} />
        <SummaryCard label="Total" value={String(total)} />
        <SummaryCard label="Accuracy" value={accuracy === null ? 'Waiting' : `${accuracy}%`} />
        <SummaryCard label="Streak" value={String(streak)} />
      </div>

      <div className="flex flex-wrap gap-3">
        {MODES.map((modeOption) => (
          <button
            key={modeOption.value}
            onClick={() => setMode(modeOption.value)}
            className={`flex flex-col gap-1 rounded-2xl px-5 py-3 text-left transition-colors ${
              mode === modeOption.value
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <span className="text-sm font-medium">{modeOption.label}</span>
            <span className="text-xs opacity-75">{modeOption.description}</span>
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8">
        {!currentChallenge ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="max-w-xl text-zinc-400">
              {mode === 'note'
                ? 'Start a round to hear one target note, then play it back cleanly on the guitar.'
                : 'Start a round to hear an interval, then play back the target note at the end of the prompt.'}
            </p>
            <button
              onClick={() => void newRound()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-500"
            >
              <Play size={18} />
              Start Round
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 text-center">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Current task</div>
              <p className="mt-2 text-sm text-zinc-300">
                {mode === 'note'
                  ? 'Replay the reference note, then listen for your answer.'
                  : `Replay the interval, then play back the target tone (${currentChallenge.intervalName}).`}
              </p>
            </div>

            {lastResult && (
              <div
                className={`text-2xl font-bold ${
                  lastResult === 'correct' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {lastResult === 'correct' ? 'Correct!' : 'Not quite'}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => void playChallenge()}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-700 px-5 py-2 font-medium text-white transition-colors hover:bg-zinc-600"
              >
                <Play size={16} />
                Replay Prompt
              </button>

              {isListening ? (
                <button
                  onClick={stopListening}
                  className="inline-flex items-center gap-2 rounded-xl bg-yellow-600 px-5 py-2 font-medium text-white transition-colors hover:bg-yellow-500"
                >
                  <Ear size={16} />
                  Stop Listening
                </button>
              ) : (
                <button
                  onClick={() => void listen()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 font-medium text-white transition-colors hover:bg-emerald-500"
                >
                  <Ear size={16} />
                  Listen for Answer
                </button>
              )}

              {lastResult && (
                <button
                  onClick={() => void newRound()}
                  className="rounded-xl bg-zinc-700 px-5 py-2 font-medium text-white transition-colors hover:bg-zinc-600"
                >
                  Next Round
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
