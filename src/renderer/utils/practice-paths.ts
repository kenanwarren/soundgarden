import type { PracticePath } from './learn-types'

export let PRACTICE_PATHS: PracticePath[] = []

export function _initPracticePaths(data: PracticePath[]): void {
  PRACTICE_PATHS = data
}
