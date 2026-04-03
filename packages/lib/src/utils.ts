import { bytesFrom, hexFrom } from "@ckb-ccc/core"
import * as BIPPath from "bip32-path"

/**
 * Compresses an uncompressed SECP256K1 public key.
 *
 * @param hex Uncompressed public key in hex format (65 bytes)
 * @returns Compressed public key in hex format (33 bytes)
 */
export function compressPublicKey(hex: string): string {
  const bytes = bytesFrom(hex)
  if (bytes.length === 33) return hex
  if (bytes.length !== 65) throw new Error(`Invalid public key length: ${bytes.length}`)
  const compressed = new Uint8Array(33)
  // 0x02 if even, 0x03 if odd
  compressed[0] = (bytes[64] & 1) === 0 ? 0x02 : 0x03

  // Copy the X coordinate (32 bytes)
  compressed.set(bytes.slice(1, 33), 1)
  return hexFrom(compressed)
}

/**
 * Helper to prepare BIP32 path from various formats
 */
export function prepBipPath(pathSrc: string | number[] | { toPathArray(): number[] }): number[] {
  if (Array.isArray(pathSrc)) {
    return pathSrc
  }

  if (typeof pathSrc === "object" && "toPathArray" in pathSrc) {
    return pathSrc.toPathArray()
  }

  if (typeof pathSrc === "string") {
    return BIPPath.fromString(pathSrc).toPathArray()
  }

  throw new Error(`Invalid path format: ${pathSrc}`)
}
