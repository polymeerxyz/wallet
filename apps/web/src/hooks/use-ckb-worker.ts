import type { Script, TransactionLike } from "@ckb-ccc/core"
import { useEffect } from "react"

import { useWalletStore } from "../stores/wallet.store"
import CkbWorker from "../workers/ckb?worker"

let workerInstance: Worker | null = null
let messageIdCounter = 0

type PendingRequest<T> = {
  resolve: (value: T) => void
  reject: (reason?: T) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pendingRequests = new Map<number, PendingRequest<any>>()

function getWorker() {
  if (typeof window === "undefined") return null
  if (!workerInstance) {
    workerInstance = new CkbWorker()
    console.debug("Worker instance created")
    workerInstance.onmessage = (e) => {
      const { id, result, error } = e.data
      console.debug(`Worker response received for ID ${id}:`, { result, error })
      const handlers = pendingRequests.get(id)
      if (handlers) {
        if (error) handlers.reject(new Error(error))
        else handlers.resolve(result)
        pendingRequests.delete(id)
      }
    }
  }
  return workerInstance
}

async function postMessageAsync<T>(method: string, payload: unknown): Promise<T> {
  const worker = getWorker()
  if (!worker) throw new Error("Worker not available")

  return new Promise((resolve, reject) => {
    const id = ++messageIdCounter
    pendingRequests.set(id, { resolve, reject })
    worker.postMessage({ id, method, payload })
  })
}

export function useCkbWorker() {
  const network = useWalletStore((s) => s.network)

  useEffect(() => {
    postMessageAsync("SET_NETWORK", { network }).catch((err) => {
      console.error("Failed to sync network with worker:", err)
    })
  }, [network])

  return {
    getSingleAddress: (publicKey: string, chainCode: string, isAccountBased: boolean) =>
      postMessageAsync<{ address: string; scripts: { script: Script; path: string }[] }>("GET_ADDRESS_SINGLE", {
        publicKey,
        chainCode,
        isAccountBased,
      }),

    scanUtxoWallet: (publicKey: string, chainCode: string, gapLimit?: number) =>
      postMessageAsync<{ latestUnusedAddress: string; scripts: { script: Script; path: string }[] }>("SCAN_UTXO", {
        publicKey,
        chainCode,
        gapLimit,
      }),

    getBalance: (scripts: Script[]) => postMessageAsync<string>("GET_BALANCE", { scripts }),

    getTransactions: (scripts: Script[], cursors?: Record<string, string>) =>
      postMessageAsync<{ transactions: unknown[]; cursors: Record<string, string> }>("GET_TRANSACTIONS", {
        scripts,
        cursors,
      }),

    buildSendCkb: (scripts: { script: Script; path: string }[], toAddress: string, amount: string | "max") =>
      postMessageAsync<{
        tx: TransactionLike
        signPaths: string[]
        fee: string
        contexts: TransactionLike[]
        witnesses: string[]
      }>("BUILD_SEND_CKB", {
        scripts,
        toAddress,
        amount,
      }),
  }
}
