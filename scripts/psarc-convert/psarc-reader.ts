import { createDecipheriv } from 'node:crypto'
import { inflateSync } from 'node:zlib'
import type { PsarcFile, PsarcHeader, PsarcTocEntry } from './types'

const PSARC_KEY = Buffer.from(
  'C53DB23870A1A2F71CAE64061FDD0E1157309DC85204D4C5BFDF25090DF2572C',
  'hex'
)
const PSARC_IV = Buffer.alloc(16)

function readHeader(buf: Buffer): PsarcHeader {
  const magic = buf.toString('ascii', 0, 4)
  if (magic !== 'PSAR') {
    throw new Error(`Invalid PSARC magic: ${magic}`)
  }
  return {
    magic,
    versionMajor: buf.readUInt16BE(4),
    versionMinor: buf.readUInt16BE(6),
    compressionMethod: buf.toString('ascii', 8, 12),
    tocSize: buf.readUInt32BE(12),
    tocEntrySize: buf.readUInt32BE(16),
    tocEntryCount: buf.readUInt32BE(20),
    blockSize: buf.readUInt32BE(24),
    archiveFlags: buf.readUInt32BE(28)
  }
}

function read40BitBE(buf: Buffer, offset: number): bigint {
  const high = BigInt(buf.readUInt8(offset))
  const low = BigInt(buf.readUInt32BE(offset + 1))
  return (high << 32n) | low
}

function decryptToc(buf: Buffer): Buffer {
  const decipher = createDecipheriv('aes-256-cfb', PSARC_KEY, PSARC_IV)
  decipher.setAutoPadding(false)
  return Buffer.concat([decipher.update(buf), decipher.final()])
}

function parseTocEntries(buf: Buffer, count: number, entrySize: number): PsarcTocEntry[] {
  const entries: PsarcTocEntry[] = []
  for (let i = 0; i < count; i++) {
    const off = i * entrySize
    entries.push({
      md5Hash: buf.subarray(off, off + 16),
      blockListStart: buf.readUInt32BE(off + 16),
      originalSize: read40BitBE(buf, off + 20),
      offset: read40BitBE(buf, off + 25)
    })
  }
  return entries
}

function getBlockSizeBytes(blockSize: number): number {
  if (blockSize <= 0x100) return 1
  if (blockSize <= 0x10000) return 2
  if (blockSize <= 0x1000000) return 3
  return 4
}

function readBlockSize(buf: Buffer, offset: number, bytes: number): number {
  switch (bytes) {
    case 1:
      return buf.readUInt8(offset)
    case 2:
      return buf.readUInt16BE(offset)
    case 3:
      return (buf.readUInt8(offset) << 16) | buf.readUInt16BE(offset + 1)
    case 4:
      return buf.readUInt32BE(offset)
    default:
      throw new Error(`Unexpected block size bytes: ${bytes}`)
  }
}

function extractFile(
  archive: Buffer,
  entry: PsarcTocEntry,
  blockSizes: number[],
  defaultBlockSize: number
): Buffer {
  const totalSize = Number(entry.originalSize)
  if (totalSize === 0) return Buffer.alloc(0)

  const result = Buffer.alloc(totalSize)
  let resultOffset = 0
  let archiveOffset = Number(entry.offset)
  let blockIndex = entry.blockListStart

  while (resultOffset < totalSize) {
    const blockSizeValue = blockSizes[blockIndex]
    if (blockSizeValue === undefined) {
      throw new Error(`Block index ${blockIndex} out of range`)
    }

    if (blockSizeValue === 0) {
      const copySize = Math.min(defaultBlockSize, totalSize - resultOffset)
      archive.copy(result, resultOffset, archiveOffset, archiveOffset + copySize)
      archiveOffset += copySize
      resultOffset += copySize
    } else {
      const compressed = archive.subarray(archiveOffset, archiveOffset + blockSizeValue)
      try {
        const decompressed = inflateSync(compressed)
        decompressed.copy(result, resultOffset)
        resultOffset += decompressed.length
      } catch {
        compressed.copy(result, resultOffset)
        resultOffset += compressed.length
      }
      archiveOffset += blockSizeValue
    }
    blockIndex++
  }

  return result.subarray(0, totalSize)
}

export function readPsarc(data: Buffer): PsarcFile[] {
  const header = readHeader(data)
  const headerSize = 32

  const tocDataSize = header.tocSize - headerSize
  let tocData = data.subarray(headerSize, headerSize + tocDataSize)

  if (header.archiveFlags & 4) {
    tocData = decryptToc(tocData)
  }

  const tocEntriesSize = header.tocEntryCount * header.tocEntrySize
  const entries = parseTocEntries(tocData, header.tocEntryCount, header.tocEntrySize)

  const blockSizeBytes = getBlockSizeBytes(header.blockSize)
  const blockListData = tocData.subarray(tocEntriesSize)
  const totalBlocks = Math.floor(blockListData.length / blockSizeBytes)
  const blockSizes: number[] = []
  for (let i = 0; i < totalBlocks; i++) {
    blockSizes.push(readBlockSize(blockListData, i * blockSizeBytes, blockSizeBytes))
  }

  const manifestEntry = entries[0]
  const manifestData = extractFile(data, manifestEntry, blockSizes, header.blockSize)
  const filePaths = manifestData.toString('utf8').split('\n').filter(Boolean)

  const files: PsarcFile[] = []
  for (let i = 1; i < entries.length; i++) {
    const path = filePaths[i - 1]
    if (!path) continue
    const fileData = extractFile(data, entries[i], blockSizes, header.blockSize)
    files.push({ path, data: fileData })
  }

  return files
}
