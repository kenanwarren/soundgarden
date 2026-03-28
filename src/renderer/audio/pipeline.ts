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
  private effectNodes: EffectNode[] = []
  private taps: Set<AudioNode> = new Set()

  constructor(context: AudioContext) {
    this.context = context
    this.masterGain = context.createGain()
    this.masterGain.gain.value = 1.0
    this.masterGain.connect(context.destination)
  }

  addTap(node: AudioNode): void {
    this.taps.add(node)
    if (this.sourceNode) {
      this.sourceNode.connect(node)
    }
  }

  removeTap(node: AudioNode): void {
    this.taps.delete(node)
    try { node.disconnect() } catch { /* */ }
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

    this.sourceNode.disconnect()

    for (const effect of this.effectNodes) {
      try { effect.getOutput().disconnect() } catch { /* */ }
    }

    // Reconnect all parallel taps
    for (const tap of this.taps) {
      this.sourceNode.connect(tap)
    }

    const enabledEffects = this.effectNodes.filter((e) => e.enabled)

    if (enabledEffects.length === 0) {
      this.sourceNode.connect(this.masterGain)
      return
    }

    this.sourceNode.connect(enabledEffects[0].getInput())

    for (let i = 0; i < enabledEffects.length - 1; i++) {
      enabledEffects[i].getOutput().connect(enabledEffects[i + 1].getInput())
    }

    enabledEffects[enabledEffects.length - 1].getOutput().connect(this.masterGain)
  }
}
