import { Plus, Search, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { EffectPedal } from './EffectPedal'
import { getEffectPickerSections } from '../../effects/definitions'
import { useEffectsChain } from '../../hooks/useEffectsChain'

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

  const filteredCategories = getEffectPickerSections(search)

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
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {category.effects.map((definition) => (
                        <button
                          key={definition.type}
                          onClick={() => {
                            addEffect(definition.type)
                            setShowMenu(false)
                          }}
                          className={`rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium text-white transition-all duration-150 hover:scale-[1.03] ${definition.tileClass}`}
                        >
                          {definition.label}
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
