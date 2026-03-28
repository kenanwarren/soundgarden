import type { SngBeat } from './types'

export interface GridMeasure {
  measureNum: number
  startTime: number
  endTime: number
  beatsInMeasure: number
  beatDuration: number
  tempo: number
  beats: GridBeat[]
}

export interface GridBeat {
  time: number
  duration: number
  beatIndex: number
}

export function buildBeatGrid(beats: SngBeat[]): GridMeasure[] {
  if (beats.length === 0) return []

  // Group beats by measure
  const measureMap = new Map<number, SngBeat[]>()
  for (const beat of beats) {
    const existing = measureMap.get(beat.measure) ?? []
    existing.push(beat)
    measureMap.set(beat.measure, existing)
  }

  const measureNums = [...measureMap.keys()].sort((a, b) => a - b)
  const measures: GridMeasure[] = []

  for (let i = 0; i < measureNums.length; i++) {
    const num = measureNums[i]
    const measureBeats = measureMap.get(num)!
    const startTime = measureBeats[0].time

    // End time is start of next measure, or estimate from last beat
    let endTime: number
    if (i + 1 < measureNums.length) {
      const nextBeats = measureMap.get(measureNums[i + 1])!
      endTime = nextBeats[0].time
    } else if (measureBeats.length > 1) {
      const avgBeatDur =
        (measureBeats[measureBeats.length - 1].time - measureBeats[0].time) /
        (measureBeats.length - 1)
      endTime = measureBeats[measureBeats.length - 1].time + avgBeatDur
    } else {
      endTime = startTime + 1
    }

    const beatsInMeasure = measureBeats.length
    const measureDuration = endTime - startTime
    const beatDuration = beatsInMeasure > 0 ? measureDuration / beatsInMeasure : 0.5
    const tempo = beatDuration > 0 ? 60 / beatDuration : 120

    const gridBeats: GridBeat[] = measureBeats.map((b, j) => ({
      time: b.time,
      duration: j + 1 < measureBeats.length ? measureBeats[j + 1].time - b.time : endTime - b.time,
      beatIndex: j
    }))

    measures.push({
      measureNum: num,
      startTime,
      endTime,
      beatsInMeasure,
      beatDuration,
      tempo,
      beats: gridBeats
    })
  }

  return measures
}

export function findMeasureAtTime(grid: GridMeasure[], time: number): GridMeasure | null {
  // Binary search
  let lo = 0
  let hi = grid.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (time < grid[mid].startTime) {
      hi = mid - 1
    } else if (time >= grid[mid].endTime) {
      lo = mid + 1
    } else {
      return grid[mid]
    }
  }
  // Clamp to last measure if past end
  if (lo >= grid.length && grid.length > 0) return grid[grid.length - 1]
  return null
}

export function detectTimeSignature(grid: GridMeasure[]): [number, number] {
  if (grid.length === 0) return [4, 4]

  // Most common beats-per-measure (excluding first/last which can be partial)
  const interior = grid.length > 2 ? grid.slice(1, -1) : grid
  const freq = new Map<number, number>()
  for (const m of interior) {
    freq.set(m.beatsInMeasure, (freq.get(m.beatsInMeasure) ?? 0) + 1)
  }

  let bestBeats = 4
  let bestCount = 0
  for (const [beats, count] of freq) {
    if (count > bestCount) {
      bestBeats = beats
      bestCount = count
    }
  }

  return [bestBeats, 4]
}
