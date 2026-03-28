import { useAppSettingsStore } from '../../stores/app-settings-store'

export function VolumeSlider(): JSX.Element {
  const masterVolume = useAppSettingsStore((s) => s.audio.masterVolume)
  const monitoringEnabled = useAppSettingsStore((s) => s.audio.monitoringEnabled)
  const setAudioSetting = useAppSettingsStore((s) => s.setAudioSetting)

  return (
    <div className="flex flex-col gap-1 items-center">
      <label className="text-xs text-zinc-400 uppercase tracking-wide">Volume</label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={masterVolume}
        onChange={(e) => setAudioSetting('masterVolume', parseFloat(e.target.value))}
        className="w-24 accent-emerald-500"
      />
      <span className="text-xs text-zinc-500 font-mono">
        {monitoringEnabled ? `${Math.round(masterVolume * 100)}%` : 'Muted'}
      </span>
    </div>
  )
}
