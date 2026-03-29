import { useRef, useState } from 'react'
import { GripVertical, Power, Upload, X } from 'lucide-react'
import type { EffectControlDefinition } from '../../effects/definitions'
import { getEffectDefinition } from '../../effects/definitions'
import { Knob } from '../common/Knob'
import type { EffectConfig } from '../../stores/effects-store'
import { useUiStore } from '../../stores/ui-store'

interface EffectPedalProps {
  effect: EffectConfig
  onToggle: () => void
  onRemove: () => void
  onParamChange: (param: string, value: number) => void
  onDragStart: (event: React.DragEvent) => void
  onLoadNamModel?: (data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
  onLoadCabinetIR?: (data: ArrayBuffer) => Promise<{ success: boolean; error?: string }>
  onLooperCommand?: (command: string) => void
}

interface EffectControlRendererProps {
  effect: EffectConfig
  control: EffectControlDefinition
  onParamChange: (param: string, value: number) => void
  onLoadNamModel?: (data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
  onLoadCabinetIR?: (data: ArrayBuffer) => Promise<{ success: boolean; error?: string }>
  onLooperCommand?: (command: string) => void
  indexPath: string
}

export function EffectPedal({
  effect,
  onToggle,
  onRemove,
  onParamChange,
  onDragStart,
  onLoadNamModel,
  onLoadCabinetIR,
  onLooperCommand
}: EffectPedalProps): JSX.Element {
  const definition = getEffectDefinition(effect.type)

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border-2 bg-zinc-900 p-4 transition-opacity ${
        definition.borderClass
      } ${effect.enabled ? 'opacity-100' : 'opacity-50'}`}
    >
      <div
        draggable
        onDragStart={onDragStart}
        className="flex cursor-grab items-center justify-between gap-2 active:cursor-grabbing"
      >
        <div className="flex items-center gap-1">
          <GripVertical size={14} className="text-zinc-600" />
          <span className="text-sm font-medium text-white">{definition.label}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onToggle}
            className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
              effect.enabled
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <Power size={14} />
          </button>
          <button
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 transition-colors hover:text-red-400"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        {definition.controls.length > 0 ? (
          definition.controls.map((control, index) => (
            <EffectControlRenderer
              key={`${effect.id}-${index}`}
              effect={effect}
              control={control}
              onParamChange={onParamChange}
              onLoadNamModel={onLoadNamModel}
              onLoadCabinetIR={onLoadCabinetIR}
              onLooperCommand={onLooperCommand}
              indexPath={String(index)}
            />
          ))
        ) : (
          <span className="text-xs text-zinc-500">No parameters</span>
        )}
      </div>
    </div>
  )
}

function EffectControlRenderer({
  effect,
  control,
  onParamChange,
  onLoadNamModel,
  onLoadCabinetIR,
  onLooperCommand,
  indexPath
}: EffectControlRendererProps): JSX.Element {
  if (control.kind === 'knob') {
    return (
      <Knob
        label={control.label}
        value={effect.params[control.param] ?? control.defaultValue}
        min={control.min}
        max={control.max}
        step={control.step}
        unit={control.unit}
        onChange={(value) => onParamChange(control.param, value)}
      />
    )
  }

  if (control.kind === 'group') {
    return (
      <div className={control.className ?? 'flex gap-3 justify-center'}>
        {control.controls.map((childControl, index) => (
          <EffectControlRenderer
            key={`${indexPath}-${index}`}
            effect={effect}
            control={childControl}
            onParamChange={onParamChange}
            onLoadNamModel={onLoadNamModel}
            onLoadCabinetIR={onLoadCabinetIR}
            onLooperCommand={onLooperCommand}
            indexPath={`${indexPath}-${index}`}
          />
        ))}
      </div>
    )
  }

  if (control.kind === 'looper-controls') {
    return (
      <LooperControls
        params={effect.params}
        onParamChange={onParamChange}
        onCommand={onLooperCommand}
      />
    )
  }

  if (control.kind === 'cabinet-loader') {
    return (
      <CabinetControls
        params={effect.params}
        onParamChange={onParamChange}
        onLoadIR={onLoadCabinetIR}
      />
    )
  }

  return (
    <NamControls
      params={effect.params}
      onParamChange={onParamChange}
      onLoadModel={onLoadNamModel}
    />
  )
}

function LooperControls({
  params,
  onParamChange,
  onCommand
}: {
  params: Record<string, number>
  onParamChange: (param: string, value: number) => void
  onCommand?: (command: string) => void
}): JSX.Element {
  const [loopState, setLoopState] = useState<string>('idle')

  const send = (command: string) => {
    onCommand?.(command)
    if (command === 'record') setLoopState('recording')
    else if (command === 'play') setLoopState('playing')
    else if (command === 'overdub') setLoopState('overdubbing')
    else if (command === 'stop') setLoopState('stopped')
    else if (command === 'clear') setLoopState('idle')
  }

  const buttonClass = (active: boolean, color: string) =>
    `rounded border px-2 py-1 text-xs transition-colors ${
      active
        ? `${color} text-white`
        : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
    }`

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-1.5">
        <button
          onClick={() => send('record')}
          className={buttonClass(loopState === 'recording', 'border-red-600 bg-red-600')}
        >
          Rec
        </button>
        <button
          onClick={() => send('play')}
          className={buttonClass(loopState === 'playing', 'border-green-600 bg-green-600')}
        >
          Play
        </button>
        <button
          onClick={() => send('overdub')}
          className={buttonClass(loopState === 'overdubbing', 'border-orange-600 bg-orange-600')}
        >
          Ovr
        </button>
        <button
          onClick={() => send('stop')}
          className={buttonClass(loopState === 'stopped', 'border-zinc-600 bg-zinc-600')}
        >
          Stop
        </button>
        <button onClick={() => send('clear')} className={buttonClass(false, '')}>
          Clr
        </button>
        <button onClick={() => onCommand?.('undo')} className={buttonClass(false, '')}>
          Undo
        </button>
      </div>
      <div className="flex gap-3">
        <Knob
          label="In"
          value={params.inputLevel ?? 1}
          min={0}
          max={2}
          step={0.1}
          onChange={(value) => onParamChange('inputLevel', value)}
        />
        <Knob
          label="Loop"
          value={params.loopLevel ?? 1}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => onParamChange('loopLevel', value)}
        />
        <Knob
          label="Ovr"
          value={params.overdubLevel ?? 0.8}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => onParamChange('overdubLevel', value)}
        />
      </div>
    </div>
  )
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
  const pushNotice = useUiStore((state) => state.pushNotice)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onLoadIR) return

    setLoading(true)
    setError(null)

    try {
      const data = await file.arrayBuffer()
      const result = await onLoadIR(data)
      if (result.success) {
        setIrName(file.name.replace(/\.(wav|ir)$/i, ''))
        pushNotice({
          tone: 'success',
          title: 'Cabinet IR loaded',
          description: file.name
        })
      } else {
        setError(result.error || 'Failed to load IR')
        setIrName(null)
        pushNotice({
          tone: 'error',
          title: 'Cabinet IR failed',
          description: result.error || 'Failed to load IR'
        })
      }
    } catch (err) {
      setError(String(err))
      setIrName(null)
      pushNotice({
        tone: 'error',
        title: 'Cabinet IR failed',
        description: String(err)
      })
    }

    setLoading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-3">
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
        className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-stone-400 hover:text-white"
      >
        <Upload size={12} />
        {loading ? 'Loading...' : (irName ?? 'Load IR')}
      </button>
      {error && <span className="max-w-48 text-center text-xs text-red-400">{error}</span>}
      <Knob
        label="Mix"
        value={params.mix ?? 0.8}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => onParamChange('mix', value)}
      />
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
  const pushNotice = useUiStore((state) => state.pushNotice)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onLoadModel) return

    setLoading(true)
    setError(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const result = await onLoadModel(data)
      if (result.success) {
        setModelName(String(data.metadata?.name || data.name || file.name.replace('.nam', '')))
        pushNotice({
          tone: 'success',
          title: 'NAM model loaded',
          description: file.name
        })
      } else {
        setError(result.error || 'Failed to load model')
        setModelName(null)
        pushNotice({
          tone: 'error',
          title: 'NAM model failed',
          description: result.error || 'Failed to load model'
        })
      }
    } catch (err) {
      setError(String(err))
      setModelName(null)
      pushNotice({
        tone: 'error',
        title: 'NAM model failed',
        description: String(err)
      })
    }

    setLoading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-3">
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
        className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-amber-500 hover:text-white"
      >
        <Upload size={12} />
        {loading ? 'Loading...' : (modelName ?? 'Load .nam')}
      </button>
      {error && <span className="max-w-48 text-center text-xs text-red-400">{error}</span>}
      <div className="flex gap-3">
        <Knob
          label="Input"
          value={params.inputGain ?? 1}
          min={0}
          max={16}
          step={0.1}
          onChange={(value) => onParamChange('inputGain', value)}
        />
        <Knob
          label="Output"
          value={params.outputGain ?? 1}
          min={0}
          max={4}
          step={0.1}
          onChange={(value) => onParamChange('outputGain', value)}
        />
      </div>
    </div>
  )
}
