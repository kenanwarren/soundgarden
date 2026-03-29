import type { ReactNode } from 'react'

export function LearnSection({
  title,
  eyebrow,
  description,
  actions,
  children
}: {
  title?: string
  eyebrow?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}): JSX.Element {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6">
      {(title || eyebrow || description || actions) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {eyebrow && (
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{eyebrow}</div>
            )}
            {title && <div className="mt-2 text-2xl font-semibold text-white">{title}</div>}
            {description && <p className="mt-2 max-w-3xl text-sm text-zinc-400">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={title || eyebrow || description || actions ? 'mt-5' : ''}>{children}</div>
    </section>
  )
}
