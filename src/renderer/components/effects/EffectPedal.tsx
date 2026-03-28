import { Power, X, GripVertical } from 'lucide-react'
import { Knob } from '../common/Knob'
import type { EffectConfig } from '../../stores/effects-store'

interface EffectPedalProps {
  effect: EffectConfig
  onToggle: () => void
  onRemove: () => void
  onParamChange: (param: string, value: number) => void
  onDragStart: (e: React.DragEvent) => void
}

const EFFECT_LABELS: Record<string, string> = {
  gain: 'Gain / Drive',
  eq: 'EQ',
  reverb: 'Reverb',
  delay: 'Delay',
  chorus: 'Chorus',
  compressor: 'Compressor',
  noisegate: 'Noise Gate'
}

const EFFECT_COLORS: Record<string, string> = {
  gain: 'border-orange-600',
  eq: 'border-blue-600',
  reverb: 'border-purple-600',
  delay: 'border-cyan-600',
  chorus: 'border-pink-600',
  compressor: 'border-yellow-600',
  noisegate: 'border-red-600'
}

export function EffectPedal({
  effect,
  onToggle,
  onRemove,
  onParamChange,
  onDragStart
}: EffectPedalProps): JSX.Element {
  return (
    <div
      className={`flex flex-col gap-3 p-4 bg-zinc-900 rounded-lg border-2 transition-opacity ${
        EFFECT_COLORS[effect.type] ?? 'border-zinc-700'
      } ${effect.enabled ? 'opacity-100' : 'opacity-50'}`}
    >
      <div
        draggable
        onDragStart={onDragStart}
        className="flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-1">
          <GripVertical size={14} className="text-zinc-600" />
          <span className="text-sm font-medium text-white">
            {EFFECT_LABELS[effect.type] ?? effect.type}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onToggle}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
              effect.enabled
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <Power size={14} />
          </button>
          <button
            onClick={onRemove}
            className="w-6 h-6 flex items-center justify-center rounded text-zinc-600 hover:text-red-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <EffectKnobs effect={effect} onParamChange={onParamChange} />
      </div>
    </div>
  )
}

function EffectKnobs({
  effect,
  onParamChange
}: {
  effect: EffectConfig
  onParamChange: (param: string, value: number) => void
}): JSX.Element {
  const p = effect.params
  const set = onParamChange

  switch (effect.type) {
    case 'gain':
      return (
        <>
          <Knob label="Gain" value={p.gain ?? 1} min={0} max={4} step={0.1} onChange={(v) => set('gain', v)} />
          <Knob label="Drive" value={p.drive ?? 0} min={0} max={1} step={0.01} onChange={(v) => set('drive', v)} />
        </>
      )
    case 'eq':
      return (
        <>
          <Knob label="Low" value={p.low ?? 0} min={-12} max={12} step={0.5} unit="dB" onChange={(v) => set('low', v)} />
          <Knob label="Mid" value={p.mid ?? 0} min={-12} max={12} step={0.5} unit="dB" onChange={(v) => set('mid', v)} />
          <Knob label="High" value={p.high ?? 0} min={-12} max={12} step={0.5} unit="dB" onChange={(v) => set('high', v)} />
        </>
      )
    case 'reverb':
      return (
        <Knob label="Mix" value={p.mix ?? 0.3} min={0} max={1} step={0.01} onChange={(v) => set('mix', v)} />
      )
    case 'delay':
      return (
        <>
          <Knob label="Time" value={p.time ?? 300} min={50} max={2000} step={10} unit="ms" onChange={(v) => set('time', v)} />
          <Knob label="Fdbk" value={p.feedback ?? 0.3} min={0} max={0.95} step={0.01} onChange={(v) => set('feedback', v)} />
          <Knob label="Mix" value={p.mix ?? 0.3} min={0} max={1} step={0.01} onChange={(v) => set('mix', v)} />
        </>
      )
    case 'chorus':
      return (
        <>
          <Knob label="Rate" value={p.rate ?? 1.5} min={0.1} max={10} step={0.1} unit="Hz" onChange={(v) => set('rate', v)} />
          <Knob label="Depth" value={p.depth ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => set('depth', v)} />
          <Knob label="Mix" value={p.mix ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => set('mix', v)} />
        </>
      )
    case 'compressor':
      return (
        <>
          <Knob label="Thresh" value={p.threshold ?? -20} min={-60} max={0} step={1} unit="dB" onChange={(v) => set('threshold', v)} />
          <Knob label="Ratio" value={p.ratio ?? 4} min={1} max={20} step={0.5} onChange={(v) => set('ratio', v)} />
          <Knob label="Atk" value={p.attack ?? 10} min={0.1} max={100} step={0.5} unit="ms" onChange={(v) => set('attack', v)} />
          <Knob label="Rel" value={p.release ?? 100} min={10} max={1000} step={5} unit="ms" onChange={(v) => set('release', v)} />
          <Knob label="Makeup" value={p.makeup ?? 0} min={0} max={30} step={0.5} unit="dB" onChange={(v) => set('makeup', v)} />
        </>
      )
    case 'noisegate':
      return (
        <>
          <Knob label="Thresh" value={p.threshold ?? -40} min={-80} max={0} step={1} unit="dB" onChange={(v) => set('threshold', v)} />
          <Knob label="Atk" value={p.attack ?? 1} min={0.1} max={50} step={0.5} unit="ms" onChange={(v) => set('attack', v)} />
          <Knob label="Rel" value={p.release ?? 50} min={10} max={500} step={5} unit="ms" onChange={(v) => set('release', v)} />
        </>
      )
    default:
      return <span className="text-xs text-zinc-500">No parameters</span>
  }
}
