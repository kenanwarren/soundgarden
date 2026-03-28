import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { useUiStore, type UiNoticeTone } from '../../stores/ui-store'

function toneStyles(tone: UiNoticeTone): { icon: JSX.Element; className: string } {
  switch (tone) {
    case 'success':
      return {
        icon: <CheckCircle2 size={16} />,
        className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
      }
    case 'warning':
      return {
        icon: <TriangleAlert size={16} />,
        className: 'border-amber-500/30 bg-amber-500/10 text-amber-100'
      }
    case 'error':
      return {
        icon: <AlertCircle size={16} />,
        className: 'border-rose-500/30 bg-rose-500/10 text-rose-100'
      }
    default:
      return {
        icon: <Info size={16} />,
        className: 'border-sky-500/30 bg-sky-500/10 text-sky-100'
      }
  }
}

export function NoticeStack(): JSX.Element {
  const notices = useUiStore((s) => s.notices)
  const dismissNotice = useUiStore((s) => s.dismissNotice)

  useEffect(() => {
    const timers = notices.map((notice) =>
      window.setTimeout(
        () => dismissNotice(notice.id),
        notice.timeoutMs ?? (notice.tone === 'error' ? 7000 : 4500)
      )
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [dismissNotice, notices])

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[60] flex w-full max-w-sm flex-col gap-3">
      {notices.map((notice) => {
        const style = toneStyles(notice.tone)

        return (
          <div
            key={notice.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${style.className}`}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5">{style.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{notice.title}</p>
                {notice.description && (
                  <p className="mt-1 text-sm text-white/80">{notice.description}</p>
                )}
              </div>
              <button
                onClick={() => dismissNotice(notice.id)}
                className="rounded-full p-1 text-white/60 transition-colors hover:bg-black/10 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
