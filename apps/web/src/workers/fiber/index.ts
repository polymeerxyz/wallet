import type { FiberClient } from "@polymeer/lib"

import type { WorkerMethod, WorkerRequest, WorkerResponse, WorkerTypeMap } from "./types"

let currentNetwork: "mainnet" | "testnet"
let currentClientMode: "light" | "full"
let currentFiberSecretKeyHex: string | null = null

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, method } = e.data

  try {
    const result = await handleMessage(e.data)
    self.postMessage({ id, result } as WorkerResponse)
  } catch (error) {
    console.error(`Worker error [${method}]:`, error)
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) } as WorkerResponse)
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ])
}

async function getFiberClient(): Promise<FiberClient> {
  if (!currentNetwork || !currentFiberSecretKeyHex) {
    throw new Error("Worker not initialized. Call UPDATE_CONFIG first.")
  }

  const { startFiberClient } = await import("./client")
  return startFiberClient(currentNetwork, currentFiberSecretKeyHex, currentClientMode)
}

async function handleMessage(request: WorkerRequest): Promise<WorkerTypeMap[WorkerMethod]["result"]> {
  const { method, payload } = request

  if (method === "UPDATE_CONFIG") {
    const prevMode = currentClientMode
    const prevNetwork = currentNetwork

    currentNetwork = payload.network
    currentClientMode = payload.clientMode
    currentFiberSecretKeyHex = payload.fiberSecretKeyHex

    console.log(`[Fiber Worker] Updating config: mode=${currentClientMode}, network=${currentNetwork}`)

    if (prevMode !== currentClientMode || prevNetwork !== currentNetwork) {
      const { stopFiberClient } = await import("./client")
      await stopFiberClient()
    }

    await getFiberClient()
    return {}
  }

  const fiber = await getFiberClient()

  switch (method) {
    case "CONNECT_PEER":
      return withTimeout(fiber.connectPeer(fiber.parseRelayInfo(payload.address!)), 20_000, "CONNECT_PEER")

    case "LIST_PEERS":
      return withTimeout(fiber.listPeers(), 10_000, "LIST_PEERS")

    case "OPEN_CHANNEL_WITH_EXTERNAL_FUNDING":
      return withTimeout(fiber.openChannel(payload), 30_000, "OPEN_CHANNEL_WITH_EXTERNAL_FUNDING")

    case "SUBMIT_SIGNED_FUNDING_TX":
      return withTimeout(
        fiber.submitSignedFundingTx(payload.channel_id, payload.signed_funding_tx),
        30_000,
        "SUBMIT_SIGNED_FUNDING_TX"
      )

    case "CLOSE_CHANNEL":
      return withTimeout(fiber.closeChannel(payload.channel_id, payload.force), 20_000, "CLOSE_CHANNEL")

    case "ABANDON_CHANNEL":
      return withTimeout(fiber.abandonChannel(payload), 20_000, "ABANDON_CHANNEL")

    case "CREATE_INVOICE":
      return withTimeout(fiber.createInvoice(payload), 10_000, "CREATE_INVOICE")

    case "LIST_CHANNELS":
      return withTimeout(
        fiber.listRawChannels().then((channels) => ({ channels })),
        10_000,
        "LIST_CHANNELS"
      )

    case "GET_INVOICE":
      return withTimeout(fiber.getInvoice(payload), 10_000, "GET_INVOICE")

    case "CANCEL_INVOICE":
      return withTimeout(fiber.cancelInvoice(payload), 10_000, "CANCEL_INVOICE")

    case "SEND_PAYMENT":
      return withTimeout(fiber.sendPayment(payload), 30_000, "SEND_PAYMENT")

    default: {
      const exhaustiveCheck: never = method
      throw new Error(`Method ${exhaustiveCheck} not supported`)
    }
  }
}
