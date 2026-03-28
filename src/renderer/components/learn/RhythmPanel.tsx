import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { RHYTHM_PATTERNS } from '../../utils/rhythm-patterns'
import { useRhythmStore } from '../../stores/rhythm-store'
import { useMetronomeStore } from '../../stores/metronome-store'
import { useRhythmTrainer } from '../../hooks/useRhythmTrainer'

function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= level ? 'bg-emerald-500' : 'bg-zinc-700'
          }`}
        />
      ))}
    </span>
  )
}

export function RhythmPanel(): JSX.Element {
  const { selectedPatternIndex, isRunning, results, accuracy, currentSubdivision } =
    useRhythmStore()
  const { setPatternIndex } = useRhythmStore()
  const { bpm, setBpm } = useMetronomeStore()
  const { start, stop, isConnected } = useRhythmTrainer()

  const pattern = RHYTHM_PATTERNS[selectedPatternIndex]

  const handlePatternChange = (i: number) => {
    if (isRunning) stop()
    setPatternIndex(i)
  }

  return (
    <div className="flex flex-col h-full p-8 gap-6">
      <div className="flex items-center gap-4">
        <Link to="/learn" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-white">Rhythm Trainer</h2>
      </div>

      {/* BPM control */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-400 uppercase tracking-wider">BPM</span>
        <button
          onClick={() => setBpm(bpm - 5)}
          className="w-8 h-8 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        >
          -
        </button>
        <span className="text-2xl font-mono text-white w-16 text-center">{bpm}</span>
        <button
          onClick={() => setBpm(bpm + 5)}
          className="w-8 h-8 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        >
          +
        </button>
        <input
          type="range"
          min={40}
          max={200}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="flex-1 max-w-xs accent-emerald-500"
        />
      </div>

      {/* Pattern selector */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-zinc-400 uppercase tracking-wider">Pattern</span>
        <div className="grid grid-cols-3 gap-2 max-w-2xl">
          {RHYTHM_PATTERNS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => handlePatternChange(i)}
              className={`flex flex-col gap-1 px-3 py-2 rounded-lg text-left transition-colors ${
                selectedPatternIndex === i
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{p.name}</span>
                <DifficultyDots level={p.difficulty} />
              </div>
              <span className="text-xs opacity-70">{p.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Beat grid visualization */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <div className="flex items-center gap-6 justify-center flex-wrap">
          {Array.from({ length: pattern.beatsPerMeasure }, (_, beat) => {
            const startIdx = beat * pattern.subdivisions
            const subs = pattern.hits.slice(startIdx, startIdx + pattern.subdivisions)
            return (
              <div key={beat} className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1">
                  {subs.map((isHit, subIdx) => {
                    const globalIdx = startIdx + subIdx
                    const isOnBeat = subIdx === 0
                    const isDown = subIdx % 2 === 0
                    const isCurrent = isRunning && globalIdx === currentSubdivision
                    return (
                      <div
                        key={globalIdx}
                        className={`rounded flex items-center justify-center transition-all ${
                          isOnBeat ? 'w-12 h-12' : 'w-9 h-9'
                        } ${
                          isCurrent
                            ? isHit
                              ? 'bg-emerald-500 scale-110 ring-2 ring-emerald-300'
                              : 'bg-zinc-500 scale-105 ring-2 ring-zinc-400'
                            : isHit
                              ? isDown
                                ? 'bg-emerald-700/60 border-2 border-emerald-500'
                                : 'bg-sky-700/50 border-2 border-sky-500'
                              : 'bg-zinc-800/50 border border-zinc-700/50'
                        }`}
                      >
                        {isHit ? (
                          <span
                            className={`font-bold ${isOnBeat ? 'text-base' : 'text-sm'} ${
                              isCurrent ? 'text-white' : isDown ? 'text-emerald-300' : 'text-sky-300'
                            }`}
                          >
                            {isDown ? '▼' : '▲'}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">·</span>
                        )}
                      </div>
                    )
                  })}
                </div>
                <span className="text-xs font-mono text-zinc-500">{beat + 1}</span>
              </div>
            )
          })}
        </div>
        {pattern.subdivisions > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="text-emerald-400">▼</span> downbeat
            </span>
            <span className="flex items-center gap-1">
              <span className="text-sky-400">▲</span> upbeat
            </span>
            <span className="flex items-center gap-1">
              <span className="text-zinc-600">·</span> rest
            </span>
          </div>
        )}
      </div>

      {/* Controls and results */}
      <div className="flex items-center gap-4">
        {!isConnected ? (
          <p className="text-zinc-400 text-sm">Connect your audio input on the Home page first</p>
        ) : (
          <button
            onClick={isRunning ? stop : start}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isRunning
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-zinc-700 hover:bg-zinc-600 text-white'
            }`}
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
        )}

        {accuracy !== null && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">
              Hits: <span className="text-white font-mono">{results.length}</span>
            </span>
            <span className="text-sm text-zinc-400">
              Accuracy:{' '}
              <span
                className={`font-mono font-bold ${
                  accuracy >= 80
                    ? 'text-emerald-400'
                    : accuracy >= 50
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}
              >
                {Math.round(accuracy)}%
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Timing feedback */}
      {results.length > 0 && (
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Recent timing</span>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>early</span>
              <span>|</span>
              <span>late</span>
            </div>
          </div>
          <div className="flex gap-1 items-center h-20 overflow-x-auto">
            {results.slice(-30).map((r, i) => {
              const clamped = Math.max(-50, Math.min(50, r.deltaMs))
              const pct = Math.abs(clamped)
              const isEarly = clamped < 0
              const color =
                Math.abs(r.deltaMs) < 20
                  ? 'bg-emerald-500'
                  : Math.abs(r.deltaMs) < 40
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              return (
                <div
                  key={i}
                  className="flex flex-col items-center w-3 h-full"
                  title={`${r.deltaMs > 0 ? '+' : ''}${Math.round(r.deltaMs)}ms`}
                >
                  <div className="flex-1 flex items-end">
                    {isEarly && (
                      <div className={`w-3 rounded-sm ${color}`} style={{ height: `${pct + 8}%` }} />
                    )}
                  </div>
                  <div className="w-3 h-px bg-zinc-600 flex-shrink-0" />
                  <div className="flex-1 flex items-start">
                    {!isEarly && (
                      <div className={`w-3 rounded-sm ${color}`} style={{ height: `${pct + 8}%` }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
