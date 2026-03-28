import { CheckCircle2, Circle } from 'lucide-react'

export function StepState({ done, label }: { done: boolean; label: string }): JSX.Element {
  return (
    <div className="flex items-center gap-2 text-sm">
      {done ? (
        <CheckCircle2 size={15} className="text-emerald-400" />
      ) : (
        <Circle size={15} className="text-zinc-600" />
      )}
      <span className={done ? 'text-zinc-200' : 'text-zinc-500'}>{label}</span>
    </div>
  )
}
