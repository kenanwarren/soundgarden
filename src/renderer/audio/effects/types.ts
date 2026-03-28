import type { EffectNode } from '../pipeline'
import type { EffectConfig } from '../../stores/effects-store'

export interface ManagedEffect {
  config: EffectConfig
  pipelineNode: EffectNode
  internals: Record<string, AudioNode>
  dispose: () => void
}
