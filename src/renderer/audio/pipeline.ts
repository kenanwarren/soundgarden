export interface EffectNode {
  id: string
  enabled: boolean
  getInput(): AudioNode
  getOutput(): AudioNode
}

export class AudioPipeline {
  private context: AudioContext
  private sourceNode: AudioNode | null = null
  private masterGain: GainNode
  private analyserNode: AnalyserNode | null = null
  private effectNodes: EffectNode[] = []

  constructor(context: AudioContext) {
    this.context = context
    this.masterGain = context.createGain()
    this.masterGain.gain.value = 1.0
    this.masterGain.connect(context.destination)
  }

  setAnalyserNode(node: AnalyserNode): void {
    this.analyserNode = node
  }

  connectSource(source: AudioNode): void {
    this.sourceNode = source
    this.rebuildChain()
  }

  disconnectSource(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }
  }

  getSourceNode(): AudioNode | null {
    return this.sourceNode
  }

  getEffectNodes(): EffectNode[] {
    return [...this.effectNodes]
  }

  setEffectNodes(nodes: EffectNode[]): void {
    this.effectNodes = nodes
    this.rebuildChain()
  }

  setMasterVolume(volume: number): void {
    this.masterGain.gain.setTargetAtTime(volume, this.context.currentTime, 0.01)
  }

  getMasterGainNode(): GainNode {
    return this.masterGain
  }

  getContext(): AudioContext {
    return this.context
  }

  rebuildChain(): void {
    if (!this.sourceNode) return

    // Disconnect everything from source forward
    this.sourceNode.disconnect()

    // Disconnect all effect nodes
    for (const effect of this.effectNodes) {
      try {
        effect.getOutput().disconnect()
      } catch {
        // Node may not be connected
      }
    }

    // Always connect source → analyser (parallel tap for level metering)
    if (this.analyserNode) {
      this.sourceNode.connect(this.analyserNode)
    }

    // Build chain: source → [enabled effects] → masterGain → destination
    const enabledEffects = this.effectNodes.filter((e) => e.enabled)

    if (enabledEffects.length === 0) {
      this.sourceNode.connect(this.masterGain)
      return
    }

    // Connect source to first effect
    this.sourceNode.connect(enabledEffects[0].getInput())

    // Chain effects together
    for (let i = 0; i < enabledEffects.length - 1; i++) {
      enabledEffects[i].getOutput().connect(enabledEffects[i + 1].getInput())
    }

    // Connect last effect to master gain
    enabledEffects[enabledEffects.length - 1].getOutput().connect(this.masterGain)
  }
}
