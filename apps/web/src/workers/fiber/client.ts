import { bytesFrom } from "@ckb-ccc/core"
import { Fiber } from "@nervosnetwork/fiber-js"

import { getFiberNodeConfig } from "./client.config"

let fiberClientWasm: Fiber | null = null
let startPromise: Promise<void> | null = null
let currentNetwork: "mainnet" | "testnet" | null = null
let currentClientMode: "light" | "full" | null = null

export async function startFiberClient(
  network: "mainnet" | "testnet",
  fiberKeyPairHex: string,
  clientMode: "light" | "full"
): Promise<Fiber> {
  if (startPromise && (currentNetwork !== network || currentClientMode !== clientMode)) {
    await stopFiberClient()
  }

  if (!startPromise) {
    fiberClientWasm = new Fiber()
    currentNetwork = network
    currentClientMode = clientMode

    const config =
      network === "mainnet"
        ? getFiberNodeConfig("mainnet", clientMode === "light")
        : getFiberNodeConfig("testnet", clientMode === "light")
    const fiberKeyPair = bytesFrom(fiberKeyPairHex)

    startPromise = fiberClientWasm.start(config, fiberKeyPair, undefined, undefined, "info", `/data/${network}/fiber`)
  }

  await startPromise
  return fiberClientWasm!
}

export async function stopFiberClient(): Promise<void> {
  if (fiberClientWasm) {
    await fiberClientWasm.stop()
    fiberClientWasm = null
    startPromise = null
    currentNetwork = null
    currentClientMode = null
  }
}
