import { useSystemStatus } from '../hooks/useSystemStatus'
import { EffectsChainPanel } from '../components/effects/EffectsChain'
import { PageHeader } from '../components/layout/PageHeader'
import { AudioRequiredState } from '../components/common/AudioRequiredState'

export function EffectsPage(): JSX.Element {
  const isConnected = useSystemStatus().isConnected

  if (!isConnected) {
    return <AudioRequiredState featureName="The effects chain" />
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Effects"
        description="Build a live chain, search by effect type, and drag pedals into the order that matches your rig."
      />
      <EffectsChainPanel />
    </div>
  )
}
