import type {
  DifficultyGrade,
  DifficultyTier,
  PracticeDifficulty
} from '../../src/renderer/utils/learn-types'
import type { SngData } from './types'

export type ArrangementType = 'lead' | 'rhythm' | 'bass'

interface DifficultyLevel {
  rsLevel: number
  difficulty: PracticeDifficulty
}

// Default tier mapping per arrangement type
const ARRANGEMENT_TIERS: Record<ArrangementType, [DifficultyTier, DifficultyTier]> = {
  rhythm: ['Beginner', 'Intermediate'],
  lead: ['Intermediate', 'Advanced'],
  bass: ['Intermediate', 'Advanced']
}

export function sampleDifficultyLevels(
  sngData: SngData,
  arrangementType: ArrangementType,
  baseDifficulty?: PracticeDifficulty
): DifficultyLevel[] {
  const maxDifficulty = getMaxDifficulty(sngData)
  if (maxDifficulty < 0) return []

  // Sample up to 3 levels: low, mid, max
  const sampledLevels: number[] = []
  if (maxDifficulty === 0) {
    sampledLevels.push(0)
  } else if (maxDifficulty === 1) {
    sampledLevels.push(0, 1)
  } else {
    sampledLevels.push(0, Math.floor(maxDifficulty / 2), maxDifficulty)
  }

  // Map sampled levels to difficulty grades
  if (baseDifficulty) {
    return mapWithBase(sampledLevels, baseDifficulty)
  }

  return mapDefault(sampledLevels, arrangementType)
}

function getMaxDifficulty(sngData: SngData): number {
  let max = -1
  for (const phrase of sngData.phrases) {
    if (phrase.maxDifficulty > max) max = phrase.maxDifficulty
  }
  // Also check arrangement levels
  for (const arr of sngData.arrangements) {
    if (arr.difficulty > max) max = arr.difficulty
  }
  return max
}

function mapDefault(sampledLevels: number[], arrangementType: ArrangementType): DifficultyLevel[] {
  const [lowTier, highTier] = ARRANGEMENT_TIERS[arrangementType]

  if (sampledLevels.length === 1) {
    return [{ rsLevel: sampledLevels[0], difficulty: { tier: lowTier, grade: 1 } }]
  }

  if (sampledLevels.length === 2) {
    return [
      { rsLevel: sampledLevels[0], difficulty: { tier: lowTier, grade: 1 } },
      { rsLevel: sampledLevels[1], difficulty: { tier: highTier, grade: 1 } }
    ]
  }

  // 3 levels
  return [
    { rsLevel: sampledLevels[0], difficulty: { tier: lowTier, grade: 1 } },
    { rsLevel: sampledLevels[1], difficulty: { tier: lowTier, grade: 3 } },
    { rsLevel: sampledLevels[2], difficulty: { tier: highTier, grade: 2 } }
  ]
}

function mapWithBase(sampledLevels: number[], base: PracticeDifficulty): DifficultyLevel[] {
  const baseRank = tierRank(base.tier) * 3 + (base.grade - 1)

  return sampledLevels.map((rsLevel, i) => {
    const rank = Math.min(baseRank + i, 8)
    return { rsLevel, difficulty: rankToDifficulty(rank) }
  })
}

function tierRank(tier: DifficultyTier): number {
  if (tier === 'Beginner') return 0
  if (tier === 'Intermediate') return 1
  return 2
}

function rankToDifficulty(rank: number): PracticeDifficulty {
  const clamped = Math.max(0, Math.min(8, rank))
  const tierIndex = Math.floor(clamped / 3)
  const grade = (clamped % 3) + 1
  const tiers: DifficultyTier[] = ['Beginner', 'Intermediate', 'Advanced']
  return { tier: tiers[tierIndex], grade: grade as DifficultyGrade }
}

export function parseDifficultyArg(arg: string): PracticeDifficulty | null {
  const match = arg.match(/^(Beginner|Intermediate|Advanced)\s+([123])$/)
  if (!match) return null
  return { tier: match[1] as DifficultyTier, grade: parseInt(match[2], 10) as DifficultyGrade }
}
