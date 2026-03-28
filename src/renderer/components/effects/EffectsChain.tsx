import { Plus, Search, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { EffectPedal } from './EffectPedal'
import { useEffectsChain } from '../../hooks/useEffectsChain'
import type { AudioProcessorType } from '../../audio/types'

const EFFECT_CATEGORIES: {
  name: string
  effects: { type: AudioProcessorType; label: string }[]
}[] = [
  {
    name: 'Dynamics',
    effects: [
      { type: 'noisegate', label: 'Noise Gate' },
      { type: 'compressor', label: 'Compressor' },
      { type: 'limiter', label: 'Limiter' }
    ]
  },
  {
    name: 'Drive',
    effects: [
      { type: 'cleanboost', label: 'Clean Boost' },
      { type: 'gain', label: 'Gain / Drive' },
      { type: 'distortion', label: 'Distortion' }
    ]
  },
  {
    name: 'EQ',
    effects: [
      { type: 'eq', label: 'EQ' },
      { type: 'graphiceq', label: 'Graphic EQ' },
      { type: 'parameq', label: 'Parametric EQ' }
    ]
  },
  {
    name: 'Pitch',
    effects: [
      { type: 'octaver', label: 'Octaver' },
      { type: 'harmonizer', label: 'Harmonizer' },
      { type: 'pitchshift', label: 'Pitch Shifter' }
    ]
  },
  {
    name: 'Modulation',
    effects: [
      { type: 'wah', label: 'Wah' },
      { type: 'chorus', label: 'Chorus' },
      { type: 'tremolo', label: 'Tremolo' },
      { type: 'phaser', label: 'Phaser' },
      { type: 'flanger', label: 'Flanger' },
      { type: 'rotary', label: 'Rotary Speaker' },
      { type: 'ringmod', label: 'Ring Mod' },
      { type: 'bitcrusher', label: 'Bitcrusher' }
    ]
  },
  {
    name: 'Space',
    effects: [
      { type: 'reverb', label: 'Reverb' },
      { type: 'shimmer', label: 'Shimmer Reverb' },
      { type: 'delay', label: 'Delay' }
    ]
  },
  {
    name: 'Utility',
    effects: [
      { type: 'autoswell', label: 'Auto-Swell' },
      { type: 'looper', label: 'Looper' },
      { type: 'cabinet', label: 'Cabinet Sim' },
      { type: 'nam', label: 'NAM Capture' }
    ]
  }
]

const TILE_COLORS: Record<string, string> = {
  noisegate: 'border-red-600 bg-red-600/10 hover:bg-red-600/25',
  compressor: 'border-yellow-600 bg-yellow-600/10 hover:bg-yellow-600/25',
  limiter: 'border-red-500 bg-red-500/10 hover:bg-red-500/25',
  cleanboost: 'border-emerald-600 bg-emerald-600/10 hover:bg-emerald-600/25',
  gain: 'border-orange-600 bg-orange-600/10 hover:bg-orange-600/25',
  distortion: 'border-rose-600 bg-rose-600/10 hover:bg-rose-600/25',
  eq: 'border-blue-600 bg-blue-600/10 hover:bg-blue-600/25',
  graphiceq: 'border-sky-600 bg-sky-600/10 hover:bg-sky-600/25',
  parameq: 'border-blue-600 bg-blue-600/10 hover:bg-blue-600/25',
  octaver: 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/25',
  harmonizer: 'border-violet-500 bg-violet-500/10 hover:bg-violet-500/25',
  pitchshift: 'border-sky-600 bg-sky-600/10 hover:bg-sky-600/25',
  wah: 'border-teal-600 bg-teal-600/10 hover:bg-teal-600/25',
  chorus: 'border-pink-600 bg-pink-600/10 hover:bg-pink-600/25',
  tremolo: 'border-lime-600 bg-lime-600/10 hover:bg-lime-600/25',
  phaser: 'border-violet-600 bg-violet-600/10 hover:bg-violet-600/25',
  flanger: 'border-fuchsia-600 bg-fuchsia-600/10 hover:bg-fuchsia-600/25',
  rotary: 'border-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/25',
  ringmod: 'border-indigo-600 bg-indigo-600/10 hover:bg-indigo-600/25',
  bitcrusher: 'border-green-600 bg-green-600/10 hover:bg-green-600/25',
  reverb: 'border-purple-600 bg-purple-600/10 hover:bg-purple-600/25',
  shimmer: 'border-purple-500 bg-purple-500/10 hover:bg-purple-500/25',
  delay: 'border-cyan-600 bg-cyan-600/10 hover:bg-cyan-600/25',
  autoswell: 'border-amber-600 bg-amber-600/10 hover:bg-amber-600/25',
  looper: 'border-red-600 bg-red-600/10 hover:bg-red-600/25',
  cabinet: 'border-stone-500 bg-stone-500/10 hover:bg-stone-500/25',
  nam: 'border-amber-500 bg-amber-500/10 hover:bg-amber-500/25'
}

export function EffectsChainPanel(): JSX.Element {
  const {
    chain,
    addEffect,
    removeEffect,
    toggleEffect,
    setParam,
    reorderEffects,
    loadNamModel,
    loadCabinetIR,
    sendLooperCommand
  } = useEffectsChain()
  const [showMenu, setShowMenu] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!showMenu) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMenu(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showMenu])

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

  const query = search.trim().toLowerCase()
  const filteredCategories = EFFECT_CATEGORIES.map((category) => ({
    ...category,
    effects: category.effects.filter(
      (effect) =>
        effect.label.toLowerCase().includes(query) || category.name.toLowerCase().includes(query)
    )
  })).filter((category) => category.effects.length > 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-white">Signal chain</div>
            <p className="mt-1 text-sm text-zinc-400">
              {chain.length > 0
                ? `Drag pedals to reorder the ${chain.length}-effect chain.`
                : 'Start with an effect category, then drag pedals into the order you want to hear.'}
            </p>
          </div>
          <button
            onClick={() => setShowMenu(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-500/20"
          >
            <Plus size={16} />
            Add Effect
          </button>
        </div>
      </div>

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
              onLoadNamModel={
                effect.type === 'nam' ? (data) => loadNamModel(effect.id, data) : undefined
              }
              onLoadCabinetIR={
                effect.type === 'cabinet' ? (data) => loadCabinetIR(effect.id, data) : undefined
              }
              onLooperCommand={
                effect.type === 'looper' ? (cmd) => sendLooperCommand(effect.id, cmd) : undefined
              }
            />
          </div>
        ))}

        {showMenu && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMenu(false)}
          >
            <div
              className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white">Add Effect</h2>
                <button
                  onClick={() => setShowMenu(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <label className="mb-5 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3">
                <Search size={16} className="text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search effects or categories"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                />
              </label>

              <div className="space-y-5">
                {filteredCategories.map((category) => (
                  <div key={category.name}>
                    <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                      {category.name}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {category.effects.map(({ type, label }) => (
                        <button
                          key={type}
                          onClick={() => {
                            addEffect(type)
                            setShowMenu(false)
                          }}
                          className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium text-white hover:scale-[1.03] transition-all duration-150 text-left ${TILE_COLORS[type] ?? 'border-zinc-700 bg-zinc-700/10 hover:bg-zinc-700/25'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredCategories.length === 0 && (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-6 text-center text-sm text-zinc-500">
                    No effects matched that search.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {chain.length === 0 && (
        <p className="text-zinc-500 text-sm">
          Click “Add Effect” to start building your signal chain.
        </p>
      )}
    </div>
  )
}
