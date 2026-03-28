import { useCallback, useRef, useState } from 'react'
import { getPlaybackContext } from '../utils/playback-context'
import { noteToFrequency } from '../utils/note-utils'
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

export interface PlaybackState {
  isPlaying: boolean
  currentMeasure: number
  currentNote: number
}

export function useNotationPlayback() {
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    currentMeasure: -1,
    currentNote: -1
  })
  const timersRef = useRef<number[]>([])
  const oscillatorsRef = useRef<OscillatorNode[]>([])
  const gainsRef = useRef<GainNode[]>([])

  const stop = useCallback(() => {
    // Clear all scheduled UI timers
    for (const t of timersRef.current) clearTimeout(t)
    timersRef.current = []

    // Stop all scheduled oscillators immediately
    const ctx = getPlaybackContext()
    const now = ctx.currentTime
    for (const gain of gainsRef.current) {
      try {
        gain.gain.cancelScheduledValues(now)
        gain.gain.setValueAtTime(0, now)
      } catch {}
    }
    for (const osc of oscillatorsRef.current) {
      try { osc.stop(now + 0.01) } catch {}
    }
    oscillatorsRef.current = []
    gainsRef.current = []

    setState({ isPlaying: false, currentMeasure: -1, currentNote: -1 })
  }, [])

  const play = useCallback(
    (notation: SongNotation, startMeasure = 0) => {
      stop()

      const ctx = getPlaybackContext()
      if (ctx.state === 'suspended') ctx.resume()

      const bpm = notation.tempo ?? 100
      const beatDuration = 60 / bpm

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

      // Schedule audio — track oscillators so stop() can kill them
      for (const ev of events) {
        if (ev.pitch !== 'rest') {
          const parsed = parsePitch(ev.pitch)
          if (parsed) {
            const freq = noteToFrequency(parsed.note, parsed.octave)
            if (freq > 0) {
              const osc = ctx.createOscillator()
              const gain = ctx.createGain()
              osc.type = 'triangle'
              osc.frequency.value = freq
              osc.connect(gain)
              gain.connect(ctx.destination)

              const dur = ev.duration * 0.9
              gain.gain.setValueAtTime(0, ev.time)
              gain.gain.linearRampToValueAtTime(0.25, ev.time + 0.02)
              gain.gain.setValueAtTime(0.25, ev.time + dur - 0.05)
              gain.gain.linearRampToValueAtTime(0, ev.time + dur)

              osc.start(ev.time)
              osc.stop(ev.time + dur)

              oscillatorsRef.current.push(osc)
              gainsRef.current.push(gain)
            }
          }
        }
      }

      // Schedule UI highlight updates
      const baseTime = ctx.currentTime
      for (const ev of events) {
        const delay = (ev.time - baseTime) * 1000
        timersRef.current.push(
          window.setTimeout(() => {
            setState({ isPlaying: true, currentMeasure: ev.measure, currentNote: ev.note })
          }, delay)
        )
      }

      // Schedule auto-stop at the end
      const endDelay = (scheduleTime - baseTime) * 1000 + 200
      timersRef.current.push(
        window.setTimeout(() => {
          oscillatorsRef.current = []
          gainsRef.current = []
          setState({ isPlaying: false, currentMeasure: -1, currentNote: -1 })
        }, endDelay)
      )
    },
    [stop]
  )

  return { ...state, play, stop }
}
