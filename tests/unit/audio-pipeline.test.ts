import { describe, expect, it } from 'vitest'
import { AudioPipeline } from '../../src/renderer/audio/pipeline'
import { MockAudioContext, MockAudioNode } from './audio-test-utils'

function makeEffect(id: string, enabled = true) {
  const input = new MockAudioNode(`${id}:input`)
  const output = new MockAudioNode(`${id}:output`)

  return {
    id,
    enabled,
    input,
    output,
    node: {
      id,
      enabled,
      getInput: () => input,
      getOutput: () => output
    }
  }
}

describe('audio-pipeline', () => {
  it('connects the master gain to the destination and schedules volume changes', () => {
    const context = new MockAudioContext()
    const pipeline = new AudioPipeline(context as unknown as AudioContext)

    expect(context.createdGains[0].connections).toEqual([context.destination])

    pipeline.setMasterVolume(0.42)

    expect(context.createdGains[0].gain.value).toBe(0.42)
    expect(context.createdGains[0].gain.setTargetAtTimeCalls).toEqual([[0.42, 0, 0.01]])
  })

  it('connects the source directly to the master gain when no effects are enabled', () => {
    const context = new MockAudioContext()
    const pipeline = new AudioPipeline(context as unknown as AudioContext)
    const source = new MockAudioNode('source')
    const tap = new MockAudioNode('tap')

    pipeline.addTap(tap as unknown as AudioNode)
    pipeline.connectSource(source as unknown as AudioNode)

    expect(source.connections).toEqual([tap, context.createdGains[0]])
  })

  it('skips disabled effects and preserves the enabled order during rebuilds', () => {
    const context = new MockAudioContext()
    const pipeline = new AudioPipeline(context as unknown as AudioContext)
    const source = new MockAudioNode('source')
    const tap = new MockAudioNode('tap')
    const first = makeEffect('first')
    const disabled = makeEffect('disabled', false)
    const last = makeEffect('last')

    pipeline.addTap(tap as unknown as AudioNode)
    pipeline.setEffectNodes([first.node, disabled.node, last.node])
    pipeline.connectSource(source as unknown as AudioNode)

    expect(source.connections).toEqual([tap, first.input])
    expect(first.output.connections).toEqual([last.input])
    expect(disabled.output.connections).toEqual([])
    expect(last.output.connections).toEqual([context.createdGains[0]])
  })

  it('reconnects taps added after the source is already attached', () => {
    const context = new MockAudioContext()
    const pipeline = new AudioPipeline(context as unknown as AudioContext)
    const source = new MockAudioNode('source')
    const tap = new MockAudioNode('tap')

    pipeline.connectSource(source as unknown as AudioNode)
    pipeline.addTap(tap as unknown as AudioNode)

    expect(source.connections).toContain(tap)

    pipeline.removeTap(tap as unknown as AudioNode)

    expect(tap.disconnectCalls).toBe(1)
  })

  it('disconnects the source and clears it from the pipeline', () => {
    const context = new MockAudioContext()
    const pipeline = new AudioPipeline(context as unknown as AudioContext)
    const source = new MockAudioNode('source')

    pipeline.connectSource(source as unknown as AudioNode)
    pipeline.disconnectSource()

    expect(source.disconnectCalls).toBe(2)
    expect(pipeline.getSourceNode()).toBeNull()
  })
})
