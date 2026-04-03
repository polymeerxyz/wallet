import type { ScriptLike } from "@ckb-ccc/core"
import { Script } from "@ckb-ccc/core"
import {
  buildSendCkbTransaction,
  getBalanceForScripts,
  getSingleAddress,
  getTransactions,
  prepareResult,
  scanUTXOAddresses,
} from "@polymeer/lib"

import { createClient } from "./client"

let client = createClient("testnet")

self.onmessage = async (e) => {
  const { id, method, payload } = e.data
  try {
    let result
    if (method === "SET_NETWORK") {
      client = createClient(payload.network)
      result = "OK"
    } else if (method === "GET_ADDRESS_SINGLE") {
      result = await getSingleAddress(client, payload.publicKey, payload.chainCode, payload.isAccountBased)
    } else if (method === "SCAN_UTXO") {
      result = await scanUTXOAddresses(client, payload.publicKey, payload.chainCode, payload.gapLimit || 20)
    } else if (method === "GET_BALANCE") {
      const scripts = payload.scripts.map((s: ScriptLike) => Script.from(s))
      result = await getBalanceForScripts(client, scripts)
    } else if (method === "GET_TRANSACTIONS") {
      const scripts = payload.scripts.map((s: ScriptLike) => Script.from(s))
      result = await getTransactions(client, scripts, payload.cursors)
    } else if (method === "BUILD_SEND_CKB") {
      const scriptInfo = payload.scripts.map((s: { script: ScriptLike; path: string }) => ({
        script: Script.from(s.script),
        path: s.path,
      }))

      const tx = await buildSendCkbTransaction(client, scriptInfo, payload.toAddress, payload.amount)

      const lockToPath = new Map<string, string>()
      scriptInfo.forEach((s) => lockToPath.set(s.script.hash(), s.path))

      result = await prepareResult(client, tx, lockToPath)
    } else {
      throw new Error("Unknown method")
    }
    self.postMessage({ id, result })
  } catch (err: unknown) {
    self.postMessage({ id, error: err instanceof Error ? err.message : String(err) })
  }
}
