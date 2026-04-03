import type { Client, Script } from "@ckb-ccc/core"
import { Address, SignerCkbPublicKey } from "@ckb-ccc/core"

import { deriveChildPublicKey } from "../derivation"
import { compressPublicKey } from "../utils"

export async function getAddressFromPubKey(client: Client, pubKeyHex: string): Promise<Address> {
  const compressed = compressPublicKey(pubKeyHex)
  const signer = new SignerCkbPublicKey(client, compressed)
  const address = await signer.getRecommendedAddress()
  return Address.fromString(address, client)
}

/**
 * Derives a single address (for ACCOUNT_BASED or SINGLE_ADDRESS)
 */
export async function getSingleAddress(client: Client, publicKey: string, chainCode: string, isAccountBased: boolean) {
  let finalPublicKey = publicKey
  let path = "m/44'/309'/0'"
  if (!isAccountBased) {
    path = "m/44'/309'/0'/0/0"
    finalPublicKey = deriveChildPublicKey(publicKey, chainCode, "m/0/0")
  }

  const addr = await getAddressFromPubKey(client, finalPublicKey)
  return { address: addr.toString(), scripts: [{ script: addr.script, path }] }
}

/**
 * Scans the UTXO wallet up to gapLimit.
 * Returns: { latestUnusedAddress, allScripts }
 */
export async function scanUTXOAddresses(client: Client, publicKey: string, chainCode: string, gapLimit: number) {
  let unusedAddress = ""
  let consecutiveEmpty = 0
  const scripts: { script: Script; path: string }[] = []

  for (let x = 0; x < 100; x++) {
    // hard limit to 100 to prevent infinite loop
    if (consecutiveEmpty >= gapLimit) break

    const rxPath = `m/44'/309'/0'/0/${x}`
    const chPath = `m/44'/309'/0'/1/${x}`

    const [rxPublicKey, chPublicKey] = await Promise.all([
      deriveChildPublicKey(publicKey, chainCode, `m/0/${x}`),
      deriveChildPublicKey(publicKey, chainCode, `m/1/${x}`),
    ])

    const rxAddr = await getAddressFromPubKey(client, rxPublicKey)
    const chAddr = await getAddressFromPubKey(client, chPublicKey)

    // Check history (minimal check: just rxAddr for simplicity in scan)
    const { transactions: rxTxs } = await client.findTransactionsPaged(
      { script: rxAddr.script, scriptType: "lock", scriptSearchMode: "exact", groupByTransaction: true },
      "desc",
      1,
      undefined
    )
    const { transactions: chTxs } = await client.findTransactionsPaged(
      { script: chAddr.script, scriptType: "lock", scriptSearchMode: "exact", groupByTransaction: true },
      "desc",
      1,
      undefined
    )

    const isUsed = rxTxs.length > 0 || chTxs.length > 0

    scripts.push({ script: rxAddr.script, path: rxPath }, { script: chAddr.script, path: chPath })

    if (isUsed) {
      consecutiveEmpty = 0
    } else {
      consecutiveEmpty++
      if (!unusedAddress) {
        unusedAddress = rxAddr.toString()
      }
    }
  }

  return { latestUnusedAddress: unusedAddress, scripts }
}
