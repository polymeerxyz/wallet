import type { WalletDerivationStrategy } from "@/stores/wallet.store"

/**
 * Custom crypto utilities using the Web Crypto API (SubtileCrypto).
 * Provides password-based encryption and decryption for wallet sync payloads.
 */

export interface SyncData {
  publicKey: string
  chainCode: string
  derivationStrategy: WalletDerivationStrategy
  network: "testnet" | "mainnet"
}

const ENCRYPTION_ALGORITHM = "AES-GCM"
const DERIVATION_ALGORITHM = "PBKDF2"
const HASH_ALGORITHM = "SHA-256"
const ITERATIONS = 100000
const SALT_SIZE = 16
const IV_SIZE = 12

async function deriveKey(password: string, salt: BufferSource): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: DERIVATION_ALGORITHM },
    false,
    ["deriveKey"]
  )

  return crypto.subtle.deriveKey(
    {
      name: DERIVATION_ALGORITHM,
      salt: salt as ArrayBuffer,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    passwordKey,
    { name: ENCRYPTION_ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

/**
 * Encrypts a JSON-serializable object with a password.
 * @returns A base64 string containing salt:iv:ciphertext
 */
export async function encryptJson(data: unknown, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE))
  const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE))
  const key = await deriveKey(password, salt)

  const ciphertext = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv },
    key,
    encoder.encode(JSON.stringify(data))
  )

  // Bundle: salt + iv + ciphertext
  const bundle = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
  bundle.set(salt, 0)
  bundle.set(iv, salt.length)
  bundle.set(new Uint8Array(ciphertext), salt.length + iv.length)

  // Encode to base64
  return btoa(String.fromCharCode(...bundle))
}

/**
 * Decrypts a base64 string back to its original JSON-serializable object.
 */
export async function decryptJson(encoded: string, password: string): Promise<unknown> {
  const decoder = new TextDecoder()
  const bundle = new Uint8Array(
    atob(encoded)
      .split("")
      .map((c) => c.charCodeAt(0))
  )

  if (bundle.length < SALT_SIZE + IV_SIZE) {
    throw new Error("Invalid sync code format")
  }

  const salt = bundle.slice(0, SALT_SIZE)
  const iv = bundle.slice(SALT_SIZE, SALT_SIZE + IV_SIZE)
  const ciphertext = bundle.slice(SALT_SIZE + IV_SIZE)

  const key = await deriveKey(password, salt)

  try {
    const decrypted = await crypto.subtle.decrypt({ name: ENCRYPTION_ALGORITHM, iv }, key, ciphertext)
    return JSON.parse(decoder.decode(decrypted))
  } catch (err) {
    throw new Error("Incorrect password or corrupted data", { cause: err })
  }
}
