export const tunerProcessorUrl = new URL('./nodes/tuner-processor.js', import.meta.url).href
export const namWasmUrl = new URL('./wasm/nam-kernel.wasm', import.meta.url).href

export const WORKLET_URLS: Record<string, string> = {
  gain: new URL('./nodes/gain-processor.js', import.meta.url).href,
  delay: new URL('./nodes/delay-processor.js', import.meta.url).href,
  chorus: new URL('./nodes/chorus-processor.js', import.meta.url).href,
  compressor: new URL('./nodes/compressor-processor.js', import.meta.url).href,
  noisegate: new URL('./nodes/noisegate-processor.js', import.meta.url).href,
  nam: new URL('./nodes/nam-processor.js', import.meta.url).href,
  tremolo: new URL('./nodes/tremolo-processor.js', import.meta.url).href,
  phaser: new URL('./nodes/phaser-processor.js', import.meta.url).href,
  flanger: new URL('./nodes/flanger-processor.js', import.meta.url).href,
  distortion: new URL('./nodes/distortion-processor.js', import.meta.url).href,
  wah: new URL('./nodes/wah-processor.js', import.meta.url).href,
  pitchshift: new URL('./nodes/pitchshift-processor.js', import.meta.url).href,
  cleanboost: new URL('./nodes/cleanboost-processor.js', import.meta.url).href,
  autoswell: new URL('./nodes/autoswell-processor.js', import.meta.url).href,
  limiter: new URL('./nodes/limiter-processor.js', import.meta.url).href,
  ringmod: new URL('./nodes/ringmod-processor.js', import.meta.url).href,
  bitcrusher: new URL('./nodes/bitcrusher-processor.js', import.meta.url).href,
  octaver: new URL('./nodes/octaver-processor.js', import.meta.url).href,
  rotary: new URL('./nodes/rotary-processor.js', import.meta.url).href,
  shimmer: new URL('./nodes/shimmer-processor.js', import.meta.url).href,
  harmonizer: new URL('./nodes/harmonizer-processor.js', import.meta.url).href,
  looper: new URL('./nodes/looper-processor.js', import.meta.url).href
}

export const WORKLET_NAMES: Record<string, string> = {
  gain: 'gain-drive-processor',
  delay: 'delay-processor',
  chorus: 'chorus-processor',
  compressor: 'compressor-processor',
  noisegate: 'noisegate-processor',
  nam: 'nam-processor',
  tremolo: 'tremolo-processor',
  phaser: 'phaser-processor',
  flanger: 'flanger-processor',
  distortion: 'distortion-processor',
  wah: 'wah-processor',
  pitchshift: 'pitchshift-processor',
  cleanboost: 'cleanboost-processor',
  autoswell: 'autoswell-processor',
  limiter: 'limiter-processor',
  ringmod: 'ringmod-processor',
  bitcrusher: 'bitcrusher-processor',
  octaver: 'octaver-processor',
  rotary: 'rotary-processor',
  shimmer: 'shimmer-processor',
  harmonizer: 'harmonizer-processor',
  looper: 'looper-processor'
}
