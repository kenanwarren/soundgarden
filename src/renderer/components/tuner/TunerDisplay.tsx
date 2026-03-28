import { useTunerStore } from '../../stores/tuner-store'
import { IN_TUNE_THRESHOLD, CLOSE_TUNE_THRESHOLD } from '../../utils/constants'

export function TunerDisplay(): JSX.Element {
  const { noteName, octave, centsOffset, frequency, clarity } = useTunerStore()

  const absCents = Math.abs(centsOffset)
  const isInTune = absCents <= IN_TUNE_THRESHOLD
  const isClose = absCents <= CLOSE_TUNE_THRESHOLD

  const noteColor = clarity === 0
    ? 'text-zinc-600'
    : isInTune
      ? 'text-emerald-400'
      : isClose
        ? 'text-yellow-400'
        : 'text-red-400'

  // Map ±50 cents to ±45% of container width (leaving room for padding)
  const needlePosition = clarity > 0 ? (centsOffset / 50) * 45 : 0

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Note display */}
      <div className="flex items-baseline gap-1">
        <span className={`text-8xl font-bold transition-colors ${noteColor}`}>
          {noteName}
        </span>
        {clarity > 0 && (
          <span className="text-3xl text-zinc-400">{octave}</span>
        )}
      </div>

      {/* Needle gauge */}
      <div className="relative w-80 h-12">
        {/* Scale marks */}
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

        {/* Needle */}
        <div
          className="absolute top-0 h-8 w-1 rounded-full transition-all duration-150"
          style={{
            left: `calc(50% + ${needlePosition}%)`,
            transform: 'translateX(-50%)',
            backgroundColor: clarity === 0 ? '#52525b' : isInTune ? '#34d399' : isClose ? '#fbbf24' : '#f87171'
          }}
        />

        {/* Center line */}
        <div className="absolute left-1/2 top-0 w-0.5 h-10 bg-emerald-500/30 -translate-x-1/2" />
      </div>

      {/* Frequency readout */}
      <div className="flex gap-6 text-sm text-zinc-500 font-mono">
        <span>{frequency > 0 ? `${frequency.toFixed(1)} Hz` : '— Hz'}</span>
        <span>{clarity > 0 ? `${centsOffset > 0 ? '+' : ''}${centsOffset} cents` : '— cents'}</span>
      </div>
    </div>
  )
}
