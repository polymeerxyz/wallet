import { hexFrom } from "@ckb-ccc/core"
import { randomSecretKey } from "@nervosnetwork/fiber-js"

import { useConfigStore } from "../stores/config.store"
import type { WorkerMethod, WorkerRequest, WorkerTypeMap } from "../workers/fiber/types"
import FiberWorker from "../workers/fiber?worker"

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
    workerInstance = new FiberWorker()
    console.debug("[Fiber Worker Hook] Worker instance created")
    workerInstance.onmessage = (e) => {
      const { id, result, error } = e.data
      const handlers = pendingRequests.get(id)
      if (handlers) {
        if (error) {
          console.debug(`[Fiber Worker Hook] Response Error for ID ${id}:`, error)
          handlers.reject(new Error(error))
        } else {
          console.debug(`[Fiber Worker Hook] Response Success for ID ${id}`)
          handlers.resolve(result)
        }
        pendingRequests.delete(id)
      }
    }
    workerInstance.onerror = (err) => {
      console.error("[Fiber Worker Hook] Worker catastrophic error:", err)
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
    console.debug(`[Fiber Worker Hook] Posting method ${method} (ID: ${id})`)
    worker.postMessage({ id, method, payload } as WorkerRequest)
  })
}

export function useFiberWorker() {
  return {
    updateConfig: async (config: { network: "mainnet" | "testnet"; clientMode: "light" | "full" }) => {
      const { network, clientMode } = config
      console.debug("[Fiber Worker Hook] Manually triggering UPDATE_CONFIG for", network)
      try {
        const FIBER_KEY_PAIR_STORAGE_KEY = `fiberKeyPair-${network}`
        let fiberKeyPairHex = localStorage.getItem(FIBER_KEY_PAIR_STORAGE_KEY)
        if (!fiberKeyPairHex) {
          fiberKeyPairHex = hexFrom(randomSecretKey())
          localStorage.setItem(FIBER_KEY_PAIR_STORAGE_KEY, fiberKeyPairHex)
        }
        await postMessageAsync("UPDATE_CONFIG", { network, clientMode, fiberKeyPairHex })
        console.debug("[Fiber Worker Hook] UPDATE_CONFIG success")
      } catch (err) {
        console.error("[Fiber Worker Hook] Failed to update config:", err)
        throw err
      }
    },

    connectPeer: (params: WorkerTypeMap["CONNECT_PEER"]["payload"]) => postMessageAsync("CONNECT_PEER", params),

    listPeers: () => postMessageAsync("LIST_PEERS", {}),

    openChannelWithExternalFunding: (params: WorkerTypeMap["OPEN_CHANNEL_WITH_EXTERNAL_FUNDING"]["payload"]) =>
      postMessageAsync("OPEN_CHANNEL_WITH_EXTERNAL_FUNDING", params),

    submitSignedFundingTx: (params: WorkerTypeMap["SUBMIT_SIGNED_FUNDING_TX"]["payload"]) =>
      postMessageAsync("SUBMIT_SIGNED_FUNDING_TX", params),

    closeChannel: (params: WorkerTypeMap["CLOSE_CHANNEL"]["payload"]) => postMessageAsync("CLOSE_CHANNEL", params),

    abandonChannel: (params: WorkerTypeMap["ABANDON_CHANNEL"]["payload"]) =>
      postMessageAsync("ABANDON_CHANNEL", params),

    createInvoice: (params: WorkerTypeMap["CREATE_INVOICE"]["payload"]) => postMessageAsync("CREATE_INVOICE", params),

    listChannels: (params: WorkerTypeMap["LIST_CHANNELS"]["payload"]) => postMessageAsync("LIST_CHANNELS", params),

    getInvoice: (params: WorkerTypeMap["GET_INVOICE"]["payload"]) => postMessageAsync("GET_INVOICE", params),

    cancelInvoice: (params: WorkerTypeMap["CANCEL_INVOICE"]["payload"]) => postMessageAsync("CANCEL_INVOICE", params),

    sendPayment: (params: WorkerTypeMap["SEND_PAYMENT"]["payload"]) => postMessageAsync("SEND_PAYMENT", params),
  }
}
