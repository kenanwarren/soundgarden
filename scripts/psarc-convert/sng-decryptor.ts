import { createDecipheriv } from 'node:crypto'
import { inflateSync } from 'node:zlib'
import { Platform } from './types'

const SNG_KEY_PC = Buffer.from(
  'CB648DF3D12A16BF71701414E69619EC171CCA5D2A142E3E59DE7ADDA18A3A30',
  'hex'
)
const SNG_KEY_MAC = Buffer.from(
  '9821330E34B91F70D0A48CBD625993126970CEA09192C0E6CDA676CC9838289D',
  'hex'
)

export function decryptSng(data: Buffer, platform: Platform = Platform.PC): Buffer {
  if (data.length < 24) {
    throw new Error('SNG data too short')
  }

  const magic = data.readUInt32LE(0)
  if (magic !== 0x4a) {
    return data
  }

  const iv = data.subarray(8, 24)
  const payload = data.subarray(24)

  const key = platform === Platform.PC ? SNG_KEY_PC : SNG_KEY_MAC
  const decipher = createDecipheriv('aes-256-ctr', key, iv)
  const decrypted = Buffer.concat([decipher.update(payload), decipher.final()])

  const uncompressedSize = decrypted.readUInt32LE(0)
  const compressed = decrypted.subarray(4)
  const result = inflateSync(compressed)
  if (result.length !== uncompressedSize) {
    console.warn(`SNG size mismatch: expected ${uncompressedSize}, got ${result.length}`)
  }
  return result
}
