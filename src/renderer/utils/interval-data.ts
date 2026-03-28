export interface IntervalDefinition {
  name: string
  shortName: string
  semitones: number
}

export let INTERVALS: IntervalDefinition[] = []

export function _initIntervals(data: IntervalDefinition[]): void {
  INTERVALS = data
}
