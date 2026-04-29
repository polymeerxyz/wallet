import { Fiber } from "@nervosnetwork/fiber-js"
import { FiberClient } from "@polymeer/lib"

import { getFiberNodeConfig } from "./client.config"

let fiberClient: FiberClient | null = null
let startPromise: Promise<void> | null = null
let currentNetwork: "mainnet" | "testnet" | null = null
let currentClientMode: "light" | "full" | null = null

export async function startFiberClient(
  network: "mainnet" | "testnet",
  secret: string,
  clientMode: "light" | "full"
): Promise<FiberClient> {
  if (startPromise && (currentNetwork !== network || currentClientMode !== clientMode)) {
    await stopFiberClient()
  }

  if (!startPromise) {
    currentNetwork = network
    currentClientMode = clientMode

    const config =
      network === "mainnet"
        ? getFiberNodeConfig("mainnet", clientMode === "light")
        : getFiberNodeConfig("testnet", clientMode === "light")

    fiberClient = new FiberClient(network, new Fiber())
    startPromise = fiberClient.start(config, secret)
  }

  await startPromise
  return fiberClient!
}

export async function stopFiberClient(): Promise<void> {
  if (fiberClient) {
    await fiberClient.stop()
    fiberClient = null
    startPromise = null
    currentNetwork = null
    currentClientMode = null
  }
}
