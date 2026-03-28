import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { readPsarc } from './psarc-reader'
import { decryptSng } from './sng-decryptor'
import { parseSng, parseVocalsSng } from './sng-parser'
import { parseArrangementXml, parseVocalsXml } from './xml-arrangement-parser'
import { parseManifests } from './manifest-parser'
import { Platform } from './types'
import type { ManifestData, PsarcFile, SngData, SngVocal } from './types'

function parseArgs(argv: string[]): {
  input: string
  dump: boolean
  output: string | null
  platform: Platform
} {
  let input = ''
  let dump = false
  let output: string | null = null
  let platform = Platform.PC

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dump') {
      dump = true
    } else if (arg === '--input' && argv[i + 1]) {
      input = argv[++i]
    } else if (arg === '--output' && argv[i + 1]) {
      output = argv[++i]
    } else if (arg === '--platform' && argv[i + 1]) {
      platform = argv[++i] === 'mac' ? Platform.Mac : Platform.PC
    } else if (!arg.startsWith('--')) {
      input = arg
    }
  }

  if (!input) {
    console.error('Usage: npx tsx scripts/psarc-convert/index.ts --input <file.psarc> [--dump] [--output <dir>] [--platform pc|mac]')
    process.exit(1)
  }

  return { input: resolve(input), dump, output: output ? resolve(output) : null, platform }
}

function classifyFile(
  path: string,
  manifests: ManifestData[]
): { type: 'lead' | 'rhythm' | 'bass' | 'vocals' | 'unknown'; manifest?: ManifestData } {
  const lower = path.toLowerCase()

  if (lower.includes('vocal')) return { type: 'vocals' }

  for (const m of manifests) {
    const arrKey = m.attributes.persistentID.toLowerCase()
    const arrName = m.attributes.arrangementName.toLowerCase()
    if (lower.includes(arrKey) || lower.includes(arrName)) {
      if (arrName === 'lead' || arrName.includes('lead')) return { type: 'lead', manifest: m }
      if (arrName === 'rhythm' || arrName.includes('rhythm')) return { type: 'rhythm', manifest: m }
      if (arrName === 'bass' || arrName.includes('bass')) return { type: 'bass', manifest: m }
      return { type: 'unknown', manifest: m }
    }
  }

  if (lower.includes('lead')) return { type: 'lead' }
  if (lower.includes('rhythm') || lower.includes('combo')) return { type: 'rhythm' }
  if (lower.includes('bass')) return { type: 'bass' }

  return { type: 'unknown' }
}

function parseFromXml(
  files: PsarcFile[],
  manifests: ManifestData[]
): Array<{ path: string; type: string; manifest?: ManifestData; data: SngData | null; vocals: SngVocal[] | null }> {
  const xmlFiles = files.filter((f) => f.path.startsWith('songs/arr/') && f.path.endsWith('.xml'))
  const results: Array<{ path: string; type: string; manifest?: ManifestData; data: SngData | null; vocals: SngVocal[] | null }> = []

  for (const xmlFile of xmlFiles) {
    if (xmlFile.path.includes('showlights')) continue

    const classification = classifyFile(xmlFile.path, manifests)
    console.log(`\n  Parsing XML: ${xmlFile.path} [${classification.type}]`)

    try {
      const xml = xmlFile.data.toString('utf8')

      if (classification.type === 'vocals') {
        const vocals = parseVocalsXml(xml)
        console.log(`    Vocals: ${vocals.length} syllables`)
        results.push({ path: xmlFile.path, type: 'vocals', data: null, vocals })
      } else {
        const parsed = parseArrangementXml(xml)
        console.log(`    Beats: ${parsed.beats.length}`)
        console.log(`    Phrases: ${parsed.phrases.length}`)
        console.log(`    Sections: ${parsed.sections.length}`)
        console.log(`    Chord templates: ${parsed.chordTemplates.length}`)
        console.log(`    Difficulty levels: ${parsed.arrangements.length}`)
        for (const level of parsed.arrangements) {
          const chordCount = parsed.chordInstances.get(level.difficulty)?.length ?? 0
          console.log(`      Level ${level.difficulty}: ${level.notes.length} notes, ${chordCount} chords`)
        }
        results.push({ path: xmlFile.path, type: classification.type, manifest: classification.manifest, data: parsed, vocals: null })
      }
    } catch (err) {
      console.error(`    Failed to parse: ${err}`)
      results.push({ path: xmlFile.path, type: classification.type, manifest: classification.manifest, data: null, vocals: null })
    }
  }

  return results
}

function parseFromSng(
  files: PsarcFile[],
  manifests: ManifestData[],
  platform: Platform
): Array<{ path: string; type: string; manifest?: ManifestData; data: SngData | null; vocals: SngVocal[] | null }> {
  const sngFiles = files.filter((f) => f.path.endsWith('.sng'))
  const results: Array<{ path: string; type: string; manifest?: ManifestData; data: SngData | null; vocals: SngVocal[] | null }> = []

  for (const sngFile of sngFiles) {
    const classification = classifyFile(sngFile.path, manifests)
    console.log(`\n  Parsing SNG: ${sngFile.path} [${classification.type}]`)

    try {
      const decrypted = decryptSng(sngFile.data, platform)

      if (classification.type === 'vocals') {
        const vocals = parseVocalsSng(decrypted)
        console.log(`    Vocals: ${vocals.length} syllables`)
        results.push({ path: sngFile.path, type: 'vocals', data: null, vocals })
      } else {
        const sngData = parseSng(decrypted)
        console.log(`    Beats: ${sngData.beats.length}`)
        console.log(`    Phrases: ${sngData.phrases.length}`)
        console.log(`    Sections: ${sngData.sections.length}`)
        console.log(`    Chord templates: ${sngData.chordTemplates.length}`)
        console.log(`    Difficulty levels: ${sngData.arrangements.length}`)
        for (const level of sngData.arrangements) {
          console.log(`      Level ${level.difficulty}: ${level.notes.length} notes`)
        }
        results.push({ path: sngFile.path, type: classification.type, manifest: classification.manifest, data: sngData, vocals: null })
      }
    } catch (err) {
      console.error(`    Failed to parse SNG: ${err}`)
      results.push({ path: sngFile.path, type: classification.type, manifest: classification.manifest, data: null, vocals: null })
    }
  }

  return results
}

function main(): void {
  const args = parseArgs(process.argv)
  console.log(`Reading PSARC: ${args.input}`)

  const psarcData = readFileSync(args.input)
  const files = readPsarc(psarcData)

  console.log(`Extracted ${files.length} files:`)
  for (const f of files) {
    console.log(`  ${f.path} (${f.data.length} bytes)`)
  }

  const manifests = parseManifests(files)
  console.log(`\nFound ${manifests.length} manifest(s):`)
  for (const m of manifests) {
    console.log(`  ${m.attributes.songName} - ${m.attributes.artistName} [${m.attributes.arrangementName}]`)
  }

  const hasXml = files.some((f) => f.path.startsWith('songs/arr/') && f.path.endsWith('.xml'))
  console.log(`\nUsing ${hasXml ? 'XML' : 'SNG binary'} parser`)

  const parsedArrangements = hasXml
    ? parseFromXml(files, manifests)
    : parseFromSng(files, manifests, args.platform)

  if (args.dump) {
    const dumpData = {
      manifests: manifests.map((m) => m.attributes),
      arrangements: parsedArrangements.map((a) => ({
        path: a.path,
        type: a.type,
        manifest: a.manifest?.attributes,
        beats: a.data?.beats.length ?? 0,
        sections: a.data?.sections ?? [],
        phrases: a.data?.phrases ?? [],
        phraseIterations: a.data?.phraseIterations ?? [],
        chordTemplates: a.data?.chordTemplates ?? [],
        difficultyLevels: a.data?.arrangements.map((level) => ({
          difficulty: level.difficulty,
          noteCount: level.notes.length,
          sampleNotes: level.notes.slice(0, 10)
        })) ?? [],
        vocals: a.vocals?.slice(0, 50) ?? []
      }))
    }

    const outputPath = args.output
      ? resolve(args.output, 'psarc-dump.json')
      : args.input.replace(/\.psarc$/i, '-dump.json')

    writeFileSync(outputPath, JSON.stringify(dumpData, null, 2))
    console.log(`\nDump written to: ${outputPath}`)
  }

  console.log('\nDone.')
}

main()
