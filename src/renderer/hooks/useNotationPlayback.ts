import { useCallback, useEffect, useState } from 'react'
import { getPlaybackContext } from '../utils/playback-context'
import { noteToFrequency } from '../utils/note-utils'
import { useAppSettingsStore, type NotationVoice } from '../stores/app-settings-store'
import type { SongNotation, NoteDuration } from '../utils/learn-types'

const DURATION_BEATS: Record<NoteDuration, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25
}

function parsePitch(pitch: string): { note: string; octave: number } | null {
  if (pitch === 'rest') return null
  const match = pitch.match(/^([A-G])(#|b)?(\d)$/)
  if (!match) return null
  const note = match[1] + (match[2] ?? '')
  return { note, octave: Number(match[3]) }
}

function playPiano(ctx: AudioContext, freq: number, time: number, dur: number): AudioNode[] {
  const nodes: AudioNode[] = []
  const harmonics = [
    { ratio: 1, gain: 0.35 },
    { ratio: 2, gain: 0.15 },
    { ratio: 3, gain: 0.06 },
    { ratio: 4, gain: 0.03 }
  ]

  const master = ctx.createGain()
  master.connect(ctx.destination)
  master.gain.setValueAtTime(0, time)
  master.gain.linearRampToValueAtTime(0.3, time + 0.008)
  master.gain.exponentialRampToValueAtTime(0.15, time + dur * 0.3)
  master.gain.exponentialRampToValueAtTime(0.001, time + dur)
  nodes.push(master)

  for (const h of harmonics) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq * h.ratio
    gain.gain.value = h.gain
    osc.connect(gain)
    gain.connect(master)
    osc.start(time)
    osc.stop(time + dur)
    nodes.push(osc, gain)
  }
  return nodes
}

function playGuitar(ctx: AudioContext, freq: number, time: number, dur: number): AudioNode[] {
  const nodes: AudioNode[] = []
  const master = ctx.createGain()
  master.connect(ctx.destination)
  master.gain.setValueAtTime(0, time)
  master.gain.linearRampToValueAtTime(0.28, time + 0.005)
  master.gain.exponentialRampToValueAtTime(0.12, time + 0.08)
  master.gain.exponentialRampToValueAtTime(0.001, time + dur)
  nodes.push(master)

  const layers: Array<{ type: OscillatorType; ratio: number; gain: number }> = [
    { type: 'triangle', ratio: 1, gain: 0.5 },
    { type: 'sawtooth', ratio: 2, gain: 0.08 },
    { type: 'sine', ratio: 3, gain: 0.04 }
  ]

  for (const l of layers) {
    const osc = ctx.createOscillator()
    osc.type = l.type
    osc.frequency.value = freq * l.ratio
    const g = ctx.createGain()
    g.gain.value = l.gain
    osc.connect(g)
    g.connect(master)
    osc.start(time)
    osc.stop(time + dur)
    nodes.push(osc, g)
  }
  return nodes
}

function playSine(ctx: AudioContext, freq: number, time: number, dur: number): AudioNode[] {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  osc.connect(gain)
  gain.connect(ctx.destination)

  gain.gain.setValueAtTime(0, time)
  gain.gain.linearRampToValueAtTime(0.25, time + 0.02)
  gain.gain.setValueAtTime(0.25, time + dur - 0.05)
  gain.gain.linearRampToValueAtTime(0, time + dur)

  osc.start(time)
  osc.stop(time + dur)
  return [osc, gain]
}

function playMusicBox(ctx: AudioContext, freq: number, time: number, dur: number): AudioNode[] {
  const nodes: AudioNode[] = []
  const master = ctx.createGain()
  master.connect(ctx.destination)
  master.gain.setValueAtTime(0, time)
  master.gain.linearRampToValueAtTime(0.2, time + 0.002)
  master.gain.exponentialRampToValueAtTime(0.001, time + dur)
  nodes.push(master)

  const harmonics = [
    { ratio: 1, gain: 0.3 },
    { ratio: 3, gain: 0.15 },
    { ratio: 5, gain: 0.08 }
  ]

  for (const h of harmonics) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq * h.ratio
    g.gain.value = h.gain
    osc.connect(g)
    g.connect(master)
    osc.start(time)
    osc.stop(time + dur)
    nodes.push(osc, g)
  }
  return nodes
}

const VOICE_PLAYERS: Record<
  NotationVoice,
  (ctx: AudioContext, freq: number, time: number, dur: number) => AudioNode[]
> = {
  piano: playPiano,
  guitar: playGuitar,
  sine: playSine,
  'music-box': playMusicBox
}

// Module-level state so playback survives component unmount/remount
let activeTimers: number[] = []
let activeNodes: AudioNode[] = []
let isPlayingGlobal = false

function stopPlayback(): void {
  for (const t of activeTimers) clearTimeout(t)
  activeTimers = []

  const ctx = getPlaybackContext()
  const now = ctx.currentTime
  for (const node of activeNodes) {
    try {
      if (node instanceof GainNode) {
        node.gain.cancelScheduledValues(now)
        node.gain.setValueAtTime(0, now)
      }
      if (node instanceof OscillatorNode) {
        node.stop(now + 0.01)
      }
    } catch {}
  }
  activeNodes = []
  isPlayingGlobal = false
}

export interface PlaybackState {
  isPlaying: boolean
  currentMeasure: number
  currentNote: number
}

export function useNotationPlayback() {
  const [state, setState] = useState<PlaybackState>({
    isPlaying: isPlayingGlobal,
    currentMeasure: -1,
    currentNote: -1
  })

  // Stop playback on unmount
  useEffect(() => {
    return () => {
      stopPlayback()
    }
  }, [])

  const stop = useCallback(() => {
    stopPlayback()
    setState({ isPlaying: false, currentMeasure: -1, currentNote: -1 })
  }, [])

  const play = useCallback(
    (notation: SongNotation, startMeasure = 0) => {
      stop()

      const voice = useAppSettingsStore.getState().practice.notationVoice
      const playNote = VOICE_PLAYERS[voice]

      const ctx = getPlaybackContext()
      if (ctx.state === 'suspended') ctx.resume()

      const bpm = notation.tempo ?? 100
      const beatDuration = 60 / bpm

      isPlayingGlobal = true
      setState({ isPlaying: true, currentMeasure: startMeasure, currentNote: 0 })

      let scheduleTime = ctx.currentTime + 0.1

      const events: Array<{
        measure: number
        note: number
        time: number
        duration: number
        pitch: string
      }> = []

      for (let mi = startMeasure; mi < notation.measures.length; mi++) {
        const measure = notation.measures[mi]
        for (let ni = 0; ni < measure.notes.length; ni++) {
          const note = measure.notes[ni]
          const beats = DURATION_BEATS[note.duration] * (note.dotted ? 1.5 : 1)
          const dur = beats * beatDuration

          events.push({
            measure: mi,
            note: ni,
            time: scheduleTime,
            duration: dur,
            pitch: note.pitch
          })

          scheduleTime += dur
        }
      }

      for (const ev of events) {
        if (ev.pitch !== 'rest') {
          const parsed = parsePitch(ev.pitch)
          if (parsed) {
            const freq = noteToFrequency(parsed.note, parsed.octave)
            if (freq > 0) {
              const nodes = playNote(ctx, freq, ev.time, ev.duration * 0.95)
              activeNodes.push(...nodes)
            }
          }
        }
      }

      const baseTime = ctx.currentTime
      for (const ev of events) {
        const delay = (ev.time - baseTime) * 1000
        activeTimers.push(
          window.setTimeout(() => {
            setState({ isPlaying: true, currentMeasure: ev.measure, currentNote: ev.note })
          }, delay)
        )
      }

      const endDelay = (scheduleTime - baseTime) * 1000 + 200
      activeTimers.push(
        window.setTimeout(() => {
          activeNodes = []
          isPlayingGlobal = false
          setState({ isPlaying: false, currentMeasure: -1, currentNote: -1 })
        }, endDelay)
      )
    },
    [stop]
  )

  return { ...state, play, stop }
}
