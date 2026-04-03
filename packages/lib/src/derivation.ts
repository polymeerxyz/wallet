import { bytesFrom, hexFrom } from "@ckb-ccc/core"
import { HDKey } from "@scure/bip32"

/**
 * Derives a child public key from an account-level extended public key.
 *
 * @param publicKeyHex Account-level public key (hex string)
 * @param chainCodeHex Account-level chain code (hex string)
 * @param path Child path relative to account level (e.g. "0/0")
 * @returns Derived public key in hex format
 */
export function deriveChildPublicKey(publicKeyHex: string, chainCodeHex: string, path: string): string {
  const publicKey = bytesFrom(publicKeyHex)
  const chainCode = bytesFrom(chainCodeHex)

  // Initialize HDKey with public key and chain code
  const accountKey = new HDKey({
    publicKey: publicKey,
    chainCode: chainCode,
  })

  // Derive child key (e.g. "0/0")
  const childKey = accountKey.derive(path)

  if (!childKey.publicKey) {
    throw new Error("Failed to derive child public key")
  }

  return hexFrom(childKey.publicKey)
}
