import type { Hex, TransactionLike } from "@ckb-ccc/core"
import { hexFrom, Transaction, WitnessArgs } from "@ckb-ccc/core"
import { toast } from "@polymeer/ui"
import { useState } from "react"

import { useAddress } from "./use-address"
import { useCkbClient } from "./use-ckb-client"
import { useCkbWorker } from "./use-ckb-worker"
import { useLedgerDevice } from "./use-ledger-device"

export interface BuiltTransaction {
  tx: TransactionLike
  signPaths: string[]
  fee: string
  contexts: TransactionLike[]
  witnesses: string[]
}

export function useSendCKB() {
  const client = useCkbClient()
  const worker = useCkbWorker()
  const { device, connect } = useLedgerDevice()
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const { scriptsWithPaths } = useAddress()

  const buildTransaction = async (toAddress: string, amount: string | "max"): Promise<BuiltTransaction> => {
    try {
      return await worker.buildSendCkb(scriptsWithPaths, toAddress, amount)
    } catch (err: unknown) {
      console.error("Build transaction error:", err)
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(message || "Failed to prepare transaction", {
        cause: err,
      })
    }
  }

  const estimateFee = async (toAddress: string, amount: string | "max"): Promise<string> => {
    try {
      const result = await buildTransaction(toAddress, amount)
      return result.fee
    } catch (err: unknown) {
      console.error("Estimate fee error:", err)
      throw err
    }
  }

  const send = async (toAddress: string, amount: string | "max") => {
    if (loading) {
      console.warn("Send operation already in progress")
      return
    }

    setLoading(true)
    setTxHash(null)

    try {
      const bt = await buildTransaction(toAddress, amount)

      let ledger = device
      if (!ledger) {
        ledger = await connect()
      }
      if (!ledger) throw new Error("Ledger not connected. Please connect your device and open the CKB app.")

      if (!bt.signPaths || bt.signPaths.length === 0 || !bt.signPaths[0]) {
        throw new Error("No valid signing path found. Please ensure your Ledger account is correctly initialized.")
      }

      if (!bt.witnesses || bt.witnesses.length === 0 || !bt.witnesses[0]) {
        throw new Error("No witnesses found for signing. This is likely an error in transaction building.")
      }

      console.debug("Raw Transaction Object:", JSON.stringify(bt.tx, null, 2))

      let signatureRaw: string
      try {
        signatureRaw = await ledger.signTransaction(bt.signPaths[0], bt.tx, bt.witnesses, bt.contexts, bt.signPaths[0])
      } catch (signErr) {
        console.error("Ledger signTransaction failed:", signErr)
        throw signErr
      }

      console.debug("Received signature from Ledger:", signatureRaw)
      const signature = (signatureRaw.startsWith("0x") ? signatureRaw : `0x${signatureRaw}`) as Hex

      const tx = Transaction.from(bt.tx)
      console.debug("Updating witness with signature...")

      try {
        const witnessArgs = WitnessArgs.fromBytes(bt.witnesses[0])
        witnessArgs.lock = signature
        tx.witnesses[0] = hexFrom(witnessArgs.toBytes())
      } catch (witnessErr) {
        console.error("Failed to update witness with Ledger signature:", witnessErr)
        throw new Error("Could not apply signature to transaction. The witness format might be invalid.", {
          cause: witnessErr,
        })
      }

      console.debug("Broadcasting transaction hash:", tx.hash())
      const hash = await client.sendTransaction(tx)

      setTxHash(hash)
      toast.success("Transaction broadcasted!")
      return hash
    } catch (err: unknown) {
      console.error("Send CKB error:", err)
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes("busy") || msg.includes("lock")) {
        toast.error("Ledger device is busy. Please ensure no other app is using it and try again.")
      } else {
        toast.error(msg)
      }
      throw err instanceof Error ? err : new Error(msg, { cause: err })
    } finally {
      setLoading(false)
    }
  }

  return { send, estimateFee, loading, txHash }
}
