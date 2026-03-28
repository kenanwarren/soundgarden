export function linearToDb(value: number): number {
  return 20 * Math.log10(Math.max(value, 1e-10))
}

export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
