import { Plus } from 'lucide-react'
import { useState, useRef } from 'react'
import { EffectPedal } from './EffectPedal'
import { useEffectsChain } from '../../hooks/useEffectsChain'
import type { AudioProcessorType } from '../../audio/types'

const AVAILABLE_EFFECTS: { type: AudioProcessorType; label: string }[] = [
  { type: 'noisegate', label: 'Noise Gate' },
  { type: 'compressor', label: 'Compressor' },
  { type: 'gain', label: 'Gain / Drive' },
  { type: 'eq', label: 'EQ' },
  { type: 'chorus', label: 'Chorus' },
  { type: 'reverb', label: 'Reverb' },
  { type: 'delay', label: 'Delay' },
  { type: 'nam', label: 'NAM Capture' }
]

export function EffectsChainPanel(): JSX.Element {
  const { chain, addEffect, removeEffect, toggleEffect, setParam, reorderEffects, loadNamModel } =
    useEffectsChain()
  const [showMenu, setShowMenu] = useState(false)
  const dragIdx = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    dragIdx.current = idx
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOverIdx(idx)
  }

  const handleDrop = (idx: number) => {
    if (dragIdx.current !== null && dragIdx.current !== idx) {
      reorderEffects(dragIdx.current, idx)
    }
    dragIdx.current = null
    setDragOverIdx(null)
  }

  const handleDragEnd = () => {
    dragIdx.current = null
    setDragOverIdx(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 items-start flex-wrap">
        {chain.map((effect, idx) => (
          <div
            key={effect.id}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            className={dragOverIdx === idx ? 'opacity-50' : ''}
          >
            <EffectPedal
              effect={effect}
              onToggle={() => toggleEffect(effect.id)}
              onRemove={() => removeEffect(effect.id)}
              onParamChange={(param, value) => setParam(effect.id, param, value)}
              onDragStart={(e) => handleDragStart(e, idx)}
              onLoadNamModel={effect.type === 'nam' ? (data) => loadNamModel(effect.id, data) : undefined}
            />
          </div>
        ))}

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-16 h-16 flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 text-zinc-500 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
          >
            <Plus size={24} />
          </button>

          {showMenu && (
            <div className="absolute top-full mt-2 left-0 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 py-1 min-w-40">
              {AVAILABLE_EFFECTS.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => {
                    addEffect(type)
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {chain.length === 0 && (
        <p className="text-zinc-500 text-sm">Click + to add effects to your signal chain</p>
      )}
    </div>
  )
}
