import { Fiber } from "@nervosnetwork/fiber-js"
import { FiberClient } from "@polymeer/lib"

import { getFiberNodeConfig } from "./client.config"

let fiberClient: FiberClient | null = null
let startPromise: Promise<FiberClient> | null = null
let currentNetwork: "mainnet" | "testnet" | null = null

export async function startFiberClient(network: "mainnet" | "testnet", secret: string): Promise<FiberClient> {
  if (startPromise && currentNetwork !== network) {
    await stopFiberClient()
  }

  if (!startPromise) {
    currentNetwork = network
    fiberClient = new FiberClient(network, new Fiber())
    startPromise = fiberClient.start(getFiberNodeConfig(network), secret).then(() => fiberClient!)
  }

  return startPromise
}

export async function stopFiberClient(): Promise<void> {
  if (fiberClient) {
    await fiberClient.stop()
    fiberClient = null
    startPromise = null
    currentNetwork = null
  }
}
