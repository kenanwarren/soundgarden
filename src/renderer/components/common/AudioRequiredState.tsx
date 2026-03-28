import { useState } from 'react'
import { Cable, MicOff, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAudioEngine } from '../../hooks/useAudioEngine'
import { useSystemStatus } from '../../hooks/useSystemStatus'

export function AudioRequiredState({ featureName }: { featureName: string }): JSX.Element {
  const { connect, inputDeviceId } = useAudioEngine()
  const status = useSystemStatus()
  const [isReconnecting, setIsReconnecting] = useState(false)

  const handleReconnect = async () => {
    if (!inputDeviceId) return
    setIsReconnecting(true)
    try {
      await connect(inputDeviceId)
    } finally {
      setIsReconnecting(false)
    }
  }

  let title = `${featureName} needs live audio`
  let description = 'Connect an input device on the Setup page to start using this tool.'

  if (status.permissionState === 'denied') {
    title = 'Microphone permission is blocked'
    description =
      'Soundgarden cannot use live audio until microphone access is granted in system settings.'
  } else if (!status.inputDeviceId) {
    title = 'Choose an input device first'
    description = 'Pick the guitar interface or microphone you want to use, then reconnect.'
  } else if (status.lastRecoverableError) {
    description = status.lastRecoverableError
  }

  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-300">
          {status.permissionState === 'denied' ? <MicOff size={24} /> : <Cable size={24} />}
        </div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-zinc-600 hover:bg-zinc-700"
          >
            Go to Setup
          </Link>
          <Link
            to="/settings"
            className="rounded-xl border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            Open Settings
          </Link>
          {status.permissionState !== 'denied' && inputDeviceId && (
            <button
              onClick={() => void handleReconnect()}
              disabled={isReconnecting}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={14} className={isReconnecting ? 'animate-spin' : ''} />
              {isReconnecting ? 'Reconnecting…' : 'Reconnect'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
