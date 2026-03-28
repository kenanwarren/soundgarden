import { Plus } from 'lucide-react'
import { useState } from 'react'
import { EffectPedal } from './EffectPedal'
import { useEffectsChain } from '../../hooks/useEffectsChain'
import type { AudioProcessorType } from '../../audio/types'

const AVAILABLE_EFFECTS: { type: AudioProcessorType; label: string }[] = [
  { type: 'gain', label: 'Gain / Drive' },
  { type: 'eq', label: 'EQ' },
  { type: 'reverb', label: 'Reverb' },
  { type: 'delay', label: 'Delay' }
]

export function EffectsChainPanel(): JSX.Element {
  const { chain, addEffect, removeEffect, toggleEffect, setParam } = useEffectsChain()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      {/* Effects strip */}
      <div className="flex gap-4 items-start flex-wrap">
        {chain.map((effect) => (
          <EffectPedal
            key={effect.id}
            effect={effect}
            onToggle={() => toggleEffect(effect.id)}
            onRemove={() => removeEffect(effect.id)}
            onParamChange={(param, value) => setParam(effect.id, param, value)}
          />
        ))}

        {/* Add effect button */}
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
