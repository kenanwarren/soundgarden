import { useAudioStore } from '../../stores/audio-store'

export function AudioMeter(): JSX.Element {
  const level = useAudioStore((s) => s.inputLevel)

  const barCount = 20
  const activeBars = Math.round(level * barCount)

  return (
    <div className="flex flex-col gap-1 items-center">
      <label className="text-xs text-zinc-400 uppercase tracking-wide">Level</label>
      <div className="flex gap-0.5 items-end h-24">
        {Array.from({ length: barCount }, (_, i) => {
          const isActive = i < activeBars
          let color = 'bg-zinc-700'
          if (isActive) {
            if (i < barCount * 0.6) color = 'bg-emerald-500'
            else if (i < barCount * 0.85) color = 'bg-yellow-500'
            else color = 'bg-red-500'
          }
          return <div key={i} className={`w-2 rounded-sm transition-colors ${color}`} style={{ height: `${((i + 1) / barCount) * 100}%` }} />
        })}
      </div>
    </div>
  )
}
