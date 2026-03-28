import { useRef, useState } from 'react'
import { Power, X, GripVertical, Upload } from 'lucide-react'
import { Knob } from '../common/Knob'
import type { EffectConfig } from '../../stores/effects-store'

interface EffectPedalProps {
  effect: EffectConfig
  onToggle: () => void
  onRemove: () => void
  onParamChange: (param: string, value: number) => void
  onDragStart: (e: React.DragEvent) => void
  onLoadNamModel?: (data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
  onLoadCabinetIR?: (data: ArrayBuffer) => Promise<{ success: boolean; error?: string }>
}

const EFFECT_LABELS: Record<string, string> = {
  gain: 'Gain / Drive',
  eq: 'EQ',
  reverb: 'Reverb',
  delay: 'Delay',
  chorus: 'Chorus',
  compressor: 'Compressor',
  noisegate: 'Noise Gate',
  nam: 'NAM Capture',
  tremolo: 'Tremolo',
  phaser: 'Phaser',
  flanger: 'Flanger',
  distortion: 'Distortion',
  wah: 'Wah',
  pitchshift: 'Pitch Shifter',
  cabinet: 'Cabinet Sim'
}

const EFFECT_COLORS: Record<string, string> = {
  gain: 'border-orange-600',
  eq: 'border-blue-600',
  reverb: 'border-purple-600',
  delay: 'border-cyan-600',
  chorus: 'border-pink-600',
  compressor: 'border-yellow-600',
  noisegate: 'border-red-600',
  nam: 'border-amber-500',
  tremolo: 'border-lime-600',
  phaser: 'border-violet-600',
  flanger: 'border-fuchsia-600',
  distortion: 'border-rose-600',
  wah: 'border-teal-600',
  pitchshift: 'border-sky-600',
  cabinet: 'border-stone-500'
}

export function EffectPedal({
  effect,
  onToggle,
  onRemove,
  onParamChange,
  onDragStart,
  onLoadNamModel,
  onLoadCabinetIR
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
        <EffectKnobs effect={effect} onParamChange={onParamChange} onLoadNamModel={onLoadNamModel} onLoadCabinetIR={onLoadCabinetIR} />
      </div>
    </div>
  )
}

function EffectKnobs({
  effect,
  onParamChange,
  onLoadNamModel,
  onLoadCabinetIR
}: {
  effect: EffectConfig
  onParamChange: (param: string, value: number) => void
  onLoadNamModel?: (data: Record<string, unknown>) => void
  onLoadCabinetIR?: (data: ArrayBuffer) => Promise<{ success: boolean; error?: string }>
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
    case 'tremolo':
      return (
        <>
          <Knob label="Rate" value={p.rate ?? 4} min={0.5} max={20} step={0.5} unit="Hz" onChange={(v) => set('rate', v)} />
          <Knob label="Depth" value={p.depth ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => set('depth', v)} />
          <Knob label="Wave" value={p.wave ?? 0} min={0} max={1} step={1} onChange={(v) => set('wave', v)} />
        </>
      )
    case 'phaser':
      return (
        <>
          <Knob label="Rate" value={p.rate ?? 0.5} min={0.05} max={5} step={0.05} unit="Hz" onChange={(v) => set('rate', v)} />
          <Knob label="Depth" value={p.depth ?? 0.7} min={0} max={1} step={0.01} onChange={(v) => set('depth', v)} />
          <Knob label="Stgs" value={p.stages ?? 4} min={2} max={12} step={2} onChange={(v) => set('stages', v)} />
          <Knob label="Fdbk" value={p.feedback ?? 0.5} min={-0.95} max={0.95} step={0.05} onChange={(v) => set('feedback', v)} />
          <Knob label="Mix" value={p.mix ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => set('mix', v)} />
        </>
      )
    case 'flanger':
      return (
        <>
          <Knob label="Rate" value={p.rate ?? 0.5} min={0.05} max={5} step={0.05} unit="Hz" onChange={(v) => set('rate', v)} />
          <Knob label="Depth" value={p.depth ?? 0.7} min={0} max={1} step={0.01} onChange={(v) => set('depth', v)} />
          <Knob label="Fdbk" value={p.feedback ?? 0.5} min={-0.95} max={0.95} step={0.05} onChange={(v) => set('feedback', v)} />
          <Knob label="Mix" value={p.mix ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => set('mix', v)} />
        </>
      )
    case 'distortion':
      return (
        <>
          <Knob label="Gain" value={p.gain ?? 3} min={0.5} max={10} step={0.1} onChange={(v) => set('gain', v)} />
          <Knob label="Tone" value={p.tone ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => set('tone', v)} />
          <Knob label="Mode" value={p.mode ?? 0} min={0} max={2} step={1} onChange={(v) => set('mode', v)} />
          <Knob label="Mix" value={p.mix ?? 1} min={0} max={1} step={0.01} onChange={(v) => set('mix', v)} />
        </>
      )
    case 'wah':
      return (
        <>
          <Knob label="Sens" value={p.sensitivity ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => set('sensitivity', v)} />
          <Knob label="Q" value={p.q ?? 5} min={1} max={15} step={0.5} onChange={(v) => set('q', v)} />
          <Knob label="Mode" value={p.mode ?? 0} min={0} max={1} step={1} onChange={(v) => set('mode', v)} />
        </>
      )
    case 'pitchshift':
      return (
        <>
          <Knob label="Semi" value={p.semitones ?? 0} min={-12} max={12} step={1} onChange={(v) => set('semitones', v)} />
          <Knob label="Mix" value={p.mix ?? 1} min={0} max={1} step={0.01} onChange={(v) => set('mix', v)} />
        </>
      )
    case 'cabinet':
      return <CabinetControls params={p} onParamChange={set} onLoadIR={onLoadCabinetIR} />
    case 'nam':
      return <NamControls params={p} onParamChange={set} onLoadModel={onLoadNamModel} />
    default:
      return <span className="text-xs text-zinc-500">No parameters</span>
  }
}

function CabinetControls({
  params,
  onParamChange,
  onLoadIR
}: {
  params: Record<string, number>
  onParamChange: (param: string, value: number) => void
  onLoadIR?: (data: ArrayBuffer) => Promise<{ success: boolean; error?: string }>
}): JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null)
  const [irName, setIrName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onLoadIR) return

    setLoading(true)
    setError(null)
    try {
      const data = await file.arrayBuffer()
      const result = await onLoadIR(data)
      if (result.success) {
        setIrName(file.name.replace(/\.(wav|ir)$/i, ''))
      } else {
        setError(result.error || 'Failed to load IR')
        setIrName(null)
      }
    } catch (err) {
      setError(String(err))
      setIrName(null)
    }
    setLoading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-3 items-center">
      <input
        ref={fileRef}
        type="file"
        accept=".wav,.ir"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 rounded border border-zinc-700 hover:border-stone-400 text-zinc-300 hover:text-white transition-colors"
      >
        <Upload size={12} />
        {loading ? 'Loading...' : irName ?? 'Load IR'}
      </button>
      {error && <span className="text-xs text-red-400 max-w-48 text-center">{error}</span>}
      <Knob label="Mix" value={params.mix ?? 0.8} min={0} max={1} step={0.01} onChange={(v) => onParamChange('mix', v)} />
    </div>
  )
}

function NamControls({
  params,
  onParamChange,
  onLoadModel
}: {
  params: Record<string, number>
  onParamChange: (param: string, value: number) => void
  onLoadModel?: (data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
}): JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null)
  const [modelName, setModelName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onLoadModel) return

    setLoading(true)
    setError(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const result = await onLoadModel(data)
      if (result.success) {
        setModelName(data.metadata?.name || data.name || file.name.replace('.nam', ''))
      } else {
        setError(result.error || 'Failed to load model')
        setModelName(null)
      }
    } catch (err) {
      setError(String(err))
      setModelName(null)
    }
    setLoading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-3 items-center">
      <input
        ref={fileRef}
        type="file"
        accept=".nam"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 rounded border border-zinc-700 hover:border-amber-500 text-zinc-300 hover:text-white transition-colors"
      >
        <Upload size={12} />
        {loading ? 'Loading...' : modelName ?? 'Load .nam'}
      </button>
      {error && <span className="text-xs text-red-400 max-w-48 text-center">{error}</span>}
      <div className="flex gap-3">
        <Knob label="Input" value={params.inputGain ?? 1} min={0} max={16} step={0.1} onChange={(v) => onParamChange('inputGain', v)} />
        <Knob label="Output" value={params.outputGain ?? 1} min={0} max={4} step={0.1} onChange={(v) => onParamChange('outputGain', v)} />
      </div>
    </div>
  )
}
