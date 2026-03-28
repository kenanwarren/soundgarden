import { Power, X } from 'lucide-react'
import { Knob } from '../common/Knob'
import type { EffectConfig } from '../../stores/effects-store'

interface EffectPedalProps {
  effect: EffectConfig
  onToggle: () => void
  onRemove: () => void
  onParamChange: (param: string, value: number) => void
}

const EFFECT_LABELS: Record<string, string> = {
  gain: 'Gain / Drive',
  eq: 'EQ',
  reverb: 'Reverb',
  delay: 'Delay'
}

const EFFECT_COLORS: Record<string, string> = {
  gain: 'border-orange-600',
  eq: 'border-blue-600',
  reverb: 'border-purple-600',
  delay: 'border-cyan-600'
}

export function EffectPedal({ effect, onToggle, onRemove, onParamChange }: EffectPedalProps): JSX.Element {
  return (
    <div
      className={`flex flex-col gap-3 p-4 bg-zinc-900 rounded-lg border-2 transition-opacity ${
        EFFECT_COLORS[effect.type] ?? 'border-zinc-700'
      } ${effect.enabled ? 'opacity-100' : 'opacity-50'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-white">{EFFECT_LABELS[effect.type] ?? effect.type}</span>
        <div className="flex gap-1">
          <button
            onClick={onToggle}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
              effect.enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-600 hover:text-zinc-400'
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

      {/* Knobs */}
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
  switch (effect.type) {
    case 'gain':
      return (
        <>
          <Knob label="Gain" value={effect.params.gain ?? 1} min={0} max={4} step={0.1} onChange={(v) => onParamChange('gain', v)} />
          <Knob label="Drive" value={effect.params.drive ?? 0} min={0} max={1} step={0.01} onChange={(v) => onParamChange('drive', v)} />
        </>
      )
    case 'eq':
      return (
        <>
          <Knob label="Low" value={effect.params.low ?? 0} min={-12} max={12} step={0.5} unit="dB" onChange={(v) => onParamChange('low', v)} />
          <Knob label="Mid" value={effect.params.mid ?? 0} min={-12} max={12} step={0.5} unit="dB" onChange={(v) => onParamChange('mid', v)} />
          <Knob label="High" value={effect.params.high ?? 0} min={-12} max={12} step={0.5} unit="dB" onChange={(v) => onParamChange('high', v)} />
        </>
      )
    case 'reverb':
      return (
        <Knob label="Mix" value={effect.params.mix ?? 0.3} min={0} max={1} step={0.01} onChange={(v) => onParamChange('mix', v)} />
      )
    case 'delay':
      return (
        <>
          <Knob label="Time" value={effect.params.time ?? 300} min={50} max={2000} step={10} unit="ms" onChange={(v) => onParamChange('time', v)} />
          <Knob label="Feedback" value={effect.params.feedback ?? 0.3} min={0} max={0.95} step={0.01} onChange={(v) => onParamChange('feedback', v)} />
          <Knob label="Mix" value={effect.params.mix ?? 0.3} min={0} max={1} step={0.01} onChange={(v) => onParamChange('mix', v)} />
        </>
      )
    default:
      return <span className="text-xs text-zinc-500">No parameters</span>
  }
}
