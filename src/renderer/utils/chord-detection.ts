import { NOTE_NAMES } from './constants'

const CHORD_TEMPLATES: [string, number[]][] = [
  ['major', [0, 4, 7]],
  ['minor', [0, 3, 7]],
  ['7', [0, 4, 7, 10]],
  ['maj7', [0, 4, 7, 11]],
  ['m7', [0, 3, 7, 10]],
  ['dim', [0, 3, 6]],
  ['aug', [0, 4, 8]],
  ['sus2', [0, 2, 7]],
  ['sus4', [0, 5, 7]],
  ['5', [0, 7]]
]

export interface ChordResult {
  name: string
  root: string
  quality: string
  confidence: number
  notes: string[]
}

export function detectChord(chromagram: Float32Array): ChordResult | null {
  if (chromagram.length !== 12) return null

  let maxEnergy = 0
  for (let i = 0; i < 12; i++) {
    if (chromagram[i] > maxEnergy) maxEnergy = chromagram[i]
  }
  if (maxEnergy === 0) return null

  const normalized = new Float32Array(12)
  for (let i = 0; i < 12; i++) {
    normalized[i] = chromagram[i] / maxEnergy
  }

  let bestScore = -Infinity
  let bestRoot = 0
  let bestQuality = 'major'

  for (let root = 0; root < 12; root++) {
    for (const [quality, template] of CHORD_TEMPLATES) {
      const score = matchTemplate(normalized, root, template)
      if (score > bestScore) {
        bestScore = score
        bestRoot = root
        bestQuality = quality
      }
    }
  }

  if (bestScore < 0.3) return null

  const qualityLabel = bestQuality === 'major' ? '' : bestQuality
  const rootName = NOTE_NAMES[bestRoot]
  const template = CHORD_TEMPLATES.find(([q]) => q === bestQuality)![1]
  const notes = template.map((interval) => NOTE_NAMES[(bestRoot + interval) % 12])

  return {
    name: `${rootName}${qualityLabel}`,
    root: rootName,
    quality: bestQuality,
    confidence: Math.min(Math.max(bestScore, 0), 1),
    notes
  }
}

function matchTemplate(chromagram: Float32Array, root: number, template: number[]): number {
  const templateSet = new Set(template.map((i) => (root + i) % 12))

  let templateEnergy = 0
  let minTemplateEnergy = Infinity
  for (const interval of template) {
    const idx = (root + interval) % 12
    const e = chromagram[idx]
    templateEnergy += e
    if (e < minTemplateEnergy) minTemplateEnergy = e
  }

  if (minTemplateEnergy < 0.3) return -1

  let outEnergy = 0
  for (let i = 0; i < 12; i++) {
    if (!templateSet.has(i)) {
      outEnergy += chromagram[i]
    }
  }

  const total = templateEnergy + outEnergy
  if (total < 0.01) return -1

  const coverage = templateEnergy / total
  const parsimony = 1 - (template.length - 2) * 0.05
  const rootEnergy = chromagram[root % 12]
  const rootDominance = rootEnergy / templateEnergy

  return coverage * parsimony + rootDominance * 0.05
}
