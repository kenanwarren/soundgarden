import { useTunerStore } from '../../stores/tuner-store'
import { IN_TUNE_THRESHOLD, CLOSE_TUNE_THRESHOLD } from '../../utils/constants'

export function TunerDisplay(): JSX.Element {
  const { noteName, octave, centsOffset, frequency, clarity, selectedPreset } = useTunerStore()

  const absCents = Math.abs(centsOffset)
  const isInTune = absCents <= IN_TUNE_THRESHOLD
  const isClose = absCents <= CLOSE_TUNE_THRESHOLD
  const hasPitch = clarity > 0

  const noteColor = !hasPitch
    ? 'text-zinc-600'
    : isInTune
      ? 'text-emerald-400'
      : isClose
        ? 'text-yellow-400'
        : 'text-red-400'

  // Map ±50 cents to ±45% of container width (leaving room for padding)
  const needlePosition = hasPitch ? (centsOffset / 50) * 45 : 0
  const statusLabel = !hasPitch
    ? `Listening for a stable note in ${selectedPreset}`
    : isInTune
      ? 'In tune'
      : centsOffset < 0
        ? 'A little flat'
        : 'A little sharp'

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Pitch</p>
        <div className="mt-3 flex items-end justify-center gap-2">
          <span className={`text-8xl font-bold transition-colors ${noteColor}`}>
            {hasPitch ? noteName : '—'}
          </span>
          {hasPitch && <span className="pb-3 text-3xl text-zinc-400">{octave}</span>}
        </div>
        <p className={`mt-3 text-sm ${hasPitch ? 'text-zinc-300' : 'text-zinc-500'}`}>
          {statusLabel}
        </p>
      </div>

      <div className="relative h-12 w-80">
        <div className="absolute inset-0 flex items-center justify-between px-4">
          {[-50, -25, 0, 25, 50].map((mark) => (
            <div key={mark} className="flex flex-col items-center">
              <div
                className="w-0.5"
                style={{
                  height: mark === 0 ? '20px' : '12px',
                  backgroundColor: mark === 0 ? '#10b981' : '#52525b'
                }}
              />
              <span className="text-xs text-zinc-500 mt-1">{mark}</span>
            </div>
          ))}
        </div>

        <div
          className="absolute top-0 h-8 w-1 rounded-full transition-all duration-150"
          style={{
            left: `calc(50% + ${needlePosition}%)`,
            transform: 'translateX(-50%)',
            backgroundColor: !hasPitch
              ? '#52525b'
              : isInTune
                ? '#34d399'
                : isClose
                  ? '#fbbf24'
                  : '#f87171'
          }}
        />

        <div className="absolute left-1/2 top-0 w-0.5 h-10 bg-emerald-500/30 -translate-x-1/2" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Frequency</div>
          <div className="mt-2 font-mono text-lg text-white">
            {frequency > 0 ? `${frequency.toFixed(1)} Hz` : '— Hz'}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Offset</div>
          <div className="mt-2 font-mono text-lg text-white">
            {hasPitch ? `${centsOffset > 0 ? '+' : ''}${centsOffset} cents` : '— cents'}
          </div>
        </div>
      </div>
    </div>
  )
}
