import { useChordDetection } from '../../hooks/useChordDetection'
import { useChordStore } from '../../stores/chord-store'
import { NOTE_NAMES } from '../../utils/constants'

export function ChordPanel(): JSX.Element {
  const { isActive, start, stop } = useChordDetection()
  const currentChord = useChordStore((s) => s.currentChord)
  const chromagram = useChordStore((s) => s.chromagram)
  const peakDb = useChordStore((s) => s.peakDb)

  return (
    <div className="flex flex-col items-center gap-8">
      <button
        onClick={isActive ? stop : start}
        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
          isActive
            ? 'bg-rose-600 hover:bg-rose-500 text-white'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
      >
        {isActive ? 'Stop Detection' : 'Start Detection'}
      </button>

      <div className="flex flex-col items-center gap-2 text-center">
        <span
          className={`text-7xl font-bold transition-colors ${
            currentChord ? 'text-emerald-400' : 'text-zinc-700'
          }`}
        >
          {currentChord?.name ?? '—'}
        </span>
        <p className="text-sm text-zinc-500">
          {currentChord
            ? 'Detected chord'
            : isActive
              ? 'Strum and let the chord settle for a moment'
              : 'Start detection to analyse the live signal'}
        </p>
        {currentChord && (
          <div className="flex gap-2 text-sm text-zinc-400">
            {currentChord.notes.map((note, i) => (
              <span key={i} className="px-2 py-0.5 bg-zinc-800 rounded">
                {note}
              </span>
            ))}
          </div>
        )}
      </div>

      {isActive && chromagram && (
        <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white">Pitch-class energy</div>
            <div className="text-xs text-zinc-500">
              Peak level: {peakDb === -Infinity ? '—' : `${Math.round(peakDb)} dB`}
            </div>
          </div>
          <div className="mt-5 flex gap-1 items-end h-32 justify-center">
            {NOTE_NAMES.map((note, i) => {
              let maxVal = 0
              for (let j = 0; j < 12; j++) {
                if (chromagram[j] > maxVal) maxVal = chromagram[j]
              }
              const normalized = maxVal > 0 ? chromagram[i] / maxVal : 0
              const isInChord = currentChord?.notes.includes(note)

              return (
                <div key={note} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-6 rounded-t transition-all ${
                      isInChord ? 'bg-emerald-500' : 'bg-zinc-600'
                    }`}
                    style={{ height: `${Math.max(normalized * 100, 4)}%` }}
                  />
                  <span
                    className={`text-xs ${
                      isInChord ? 'text-emerald-400 font-medium' : 'text-zinc-500'
                    }`}
                  >
                    {note}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!isActive && (
        <p className="text-zinc-500 text-sm">Strum a chord and it will be detected in real time</p>
      )}
    </div>
  )
}
