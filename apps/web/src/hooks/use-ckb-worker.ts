import type { CellLike, ScriptLike, TransactionLike } from "@ckb-ccc/core"
import { useEffect } from "react"

import { useWalletStore } from "../stores/wallet.store"
import type { ScriptInfoLike, WorkerMethod, WorkerRequest, WorkerTypeMap } from "../workers/ckb/types"
import CkbWorker from "../workers/ckb?worker"

let workerInstance: Worker | null = null
let messageIdCounter = 0

type PendingRequest<M extends WorkerMethod> = {
  resolve: (value: WorkerTypeMap[M]["result"]) => void
  reject: (reason: Error) => void
}

const pendingRequests = new Map<number, PendingRequest<WorkerMethod>>()

function getWorker() {
  if (typeof window === "undefined") return null
  if (!workerInstance) {
    workerInstance = new CkbWorker()
    console.debug("Worker instance created")
    workerInstance.onmessage = (e) => {
      const { id, result, error } = e.data
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

async function postMessageAsync<M extends WorkerMethod>(
  method: M,
  payload: WorkerTypeMap[M]["payload"]
): Promise<WorkerTypeMap[M]["result"]> {
  const worker = getWorker()
  if (!worker) throw new Error("Worker not available")

  return new Promise((resolve, reject) => {
    const id = ++messageIdCounter
    pendingRequests.set(id, { resolve, reject })
    worker.postMessage({ id, method, payload } as WorkerRequest)
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
      postMessageAsync("GET_ADDRESS_SINGLE", {
        publicKey,
        chainCode,
        isAccountBased,
      }),

    scanUtxoWallet: (publicKey: string, chainCode: string, gapLimit?: number) =>
      postMessageAsync("SCAN_UTXO", {
        publicKey,
        chainCode,
        gapLimit,
      }),

    getBalance: (scripts: ScriptLike[]) => postMessageAsync("GET_BALANCE", { scripts }),

    getTransactions: (scripts: ScriptLike[], cursors?: Record<string, string>) =>
      postMessageAsync("GET_TRANSACTIONS", {
        scripts,
        cursors,
      }),

    buildSendCkb: (scripts: ScriptInfoLike[], toAddress: string, amount: string | "max", feeRate?: string) =>
      postMessageAsync("BUILD_SEND_CKB", {
        scripts,
        toAddress,
        amount,
        feeRate,
      }),

    getDaoCells: (scripts: ScriptLike[]) => postMessageAsync("GET_DAO_CELLS", { scripts }),

    getDaoAPY: () => postMessageAsync("GET_DAO_APY", {}),

    buildDaoDeposit: (scripts: ScriptInfoLike[], amount: string, feeRate?: string) =>
      postMessageAsync("BUILD_DAO_DEPOSIT", { scripts, amount, feeRate }),

    buildDaoAction: (scripts: ScriptInfoLike[], cell: CellLike, feeRate?: string) =>
      postMessageAsync("BUILD_DAO_ACTION", { scripts, cell, feeRate }),

    getCell: (txHash: string, index: number) => postMessageAsync("GET_CELL", { txHash, index }),

    getTipHeader: () => postMessageAsync("GET_TIP_HEADER", {}),

    sendTransaction: (tx: TransactionLike) => postMessageAsync("SEND_TRANSACTION", { tx }),
  }
}
