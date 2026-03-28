import { Link } from 'react-router-dom'
import { ArrowLeft, Play, Ear, RotateCcw } from 'lucide-react'
import { useEarTrainingStore } from '../../stores/ear-training-store'
import { useEarTraining } from '../../hooks/useEarTraining'

const MODES = [
  { value: 'note' as const, label: 'Note', description: 'Hear a note, play it back' },
  { value: 'interval' as const, label: 'Interval', description: 'Hear two notes, play the second' }
]

export function EarTrainingPanel(): JSX.Element {
  const { mode, currentChallenge, isListening, score, streak, total, lastResult, setMode, reset } =
    useEarTrainingStore()
  const { newRound, playChallenge, listen, stopListening, isConnected } = useEarTraining()

  return (
    <div className="flex flex-col h-full p-8 gap-6">
      <div className="flex items-center gap-4">
        <Link to="/learn" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-white">Ear Training</h2>
      </div>

      {/* Mode selector */}
      <div className="flex gap-3">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`flex flex-col gap-1 px-5 py-3 rounded-lg transition-colors ${
              mode === m.value
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <span className="text-sm font-medium">{m.label}</span>
            <span className="text-xs opacity-70">{m.description}</span>
          </button>
        ))}
      </div>

      {/* Score */}
      <div className="flex gap-6">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-mono font-bold text-white">{score}</span>
          <span className="text-xs text-zinc-500 uppercase">Correct</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-mono font-bold text-white">{total}</span>
          <span className="text-xs text-zinc-500 uppercase">Total</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-mono font-bold text-emerald-400">{streak}</span>
          <span className="text-xs text-zinc-500 uppercase">Streak</span>
        </div>
        {total > 0 && (
          <button
            onClick={reset}
            className="ml-auto text-zinc-500 hover:text-white transition-colors"
            title="Reset score"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>

      {/* Challenge area */}
      <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 flex flex-col items-center gap-6">
        {!currentChallenge ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-zinc-400">
              {mode === 'note'
                ? "You'll hear a note — play it back on your guitar"
                : "You'll hear two notes — play the second one back"}
            </p>
            <button
              onClick={newRound}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Play size={18} /> Start
            </button>
          </div>
        ) : (
          <>
            {/* Challenge info */}
            {mode === 'interval' && lastResult && (
              <p className="text-zinc-400 text-sm">
                Interval: <span className="text-white font-medium">{currentChallenge.intervalName}</span>
              </p>
            )}

            {/* Result feedback */}
            {lastResult && (
              <div
                className={`text-2xl font-bold ${
                  lastResult === 'correct' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {lastResult === 'correct' ? 'Correct!' : 'Not quite'}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => playChallenge()}
                className="px-5 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Play size={16} /> Replay
              </button>

              {!isConnected ? (
                <p className="text-zinc-400 text-sm self-center">Connect audio to respond</p>
              ) : isListening ? (
                <button
                  onClick={stopListening}
                  className="px-5 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 animate-pulse"
                >
                  <Ear size={16} /> Listening...
                </button>
              ) : (
                <button
                  onClick={listen}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Ear size={16} /> Listen for Answer
                </button>
              )}

              {lastResult && (
                <button
                  onClick={newRound}
                  className="px-5 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
