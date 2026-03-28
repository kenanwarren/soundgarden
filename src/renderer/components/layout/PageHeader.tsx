import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAppSettingsStore } from '../../stores/app-settings-store'

interface PageHeaderProps {
  title: string
  description?: string
  backTo?: string
  backLabel?: string
  actions?: ReactNode
}

export function PageHeader({
  title,
  description,
  backTo,
  backLabel = 'Back',
  actions
}: PageHeaderProps): JSX.Element {
  const compactControls = useAppSettingsStore((s) => s.interface.compactControls)

  return (
    <div
      className={`flex flex-col gap-4 border-b border-zinc-800/80 pb-5 ${
        compactControls
          ? 'md:flex-row md:items-end md:justify-between'
          : 'lg:flex-row lg:items-end lg:justify-between'
      }`}
    >
      <div className="flex items-start gap-4">
        {backTo && (
          <Link
            to={backTo}
            className="mt-1 inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <ArrowLeft size={16} />
            {backLabel}
          </Link>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
          {description && <p className="max-w-3xl text-sm text-zinc-400">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}
