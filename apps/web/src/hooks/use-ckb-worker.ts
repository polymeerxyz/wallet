import type { CellLike, ScriptLike, TransactionLike } from "@ckb-ccc/core"

import { useConfigStore } from "../stores/config.store"
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
    console.debug("[Worker Hook] Worker instance created")
    workerInstance.onmessage = (e) => {
      const { id, result, error } = e.data
      const handlers = pendingRequests.get(id)
      if (handlers) {
        if (error) {
          console.debug(`[Worker Hook] Response Error for ID ${id}:`, error)
          handlers.reject(new Error(error))
        } else {
          console.debug(`[Worker Hook] Response Success for ID ${id}`)
          handlers.resolve(result)
        }
        pendingRequests.delete(id)
      }
    }
    workerInstance.onerror = (err) => {
      console.error("[Worker Hook] Worker catastrophic error:", err)
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
    console.debug(`[Worker Hook] Posting method ${method} (ID: ${id})`)
    worker.postMessage({ id, method, payload } as WorkerRequest)
  })
}

export function useCkbWorker() {
  const network = useConfigStore((s) => s.network)
  const clientMode = useConfigStore((s) => s.clientMode)
  const setInitialized = useConfigStore((s) => s.setInitialized)

  const init = async () => {
    console.debug("[Worker Hook] Manually triggering INIT for", network)

    try {
      await postMessageAsync("UPDATE_CONFIG", { network, clientMode })
      setInitialized(true)
      console.debug("[Worker Hook] INIT success")
    } catch (err) {
      console.error("[Worker Hook] Failed to initialize worker:", err)
      throw err
    }
  }

  return {
    init,
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

    getSyncProgress: () => postMessageAsync("GET_SYNC_PROGRESS", {}),

    sendTransaction: (tx: TransactionLike) => postMessageAsync("SEND_TRANSACTION", { tx }),

    updateConfig: (config: { network?: "mainnet" | "testnet"; clientMode?: "light" | "full" }) =>
      postMessageAsync("UPDATE_CONFIG", {
        network: config.network ?? network,
        clientMode: config.clientMode ?? clientMode,
      }),
  }
}
