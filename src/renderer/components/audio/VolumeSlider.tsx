import { useAudioStore } from '../../stores/audio-store'

export function VolumeSlider(): JSX.Element {
  const masterVolume = useAudioStore((s) => s.masterVolume)
  const setMasterVolume = useAudioStore((s) => s.setMasterVolume)

  return (
    <div className="flex flex-col gap-1 items-center">
      <label className="text-xs text-zinc-400 uppercase tracking-wide">Volume</label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={masterVolume}
        onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
        className="w-24 accent-emerald-500"
      />
      <span className="text-xs text-zinc-500 font-mono">{Math.round(masterVolume * 100)}%</span>
    </div>
  )
}
