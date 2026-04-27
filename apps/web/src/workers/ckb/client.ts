import type { ScriptLike } from "@ckb-ccc/core"
import { numFrom, Script } from "@ckb-ccc/core"
import { ClientLight } from "@polymeer/lib"
import type { NetworkSetting } from "ckb-light-client-js"
import { LightClient, LightClientSetScriptsCommand } from "ckb-light-client-js"

import { getLightNodeConfig } from "./client.config"
import type { ScriptInfoLike } from "./types"

let lightClientWasm: LightClient | null = null
let startPromise: Promise<void> | null = null
let currentNetwork: "mainnet" | "testnet" | null = null

export async function startLightClient(network: "mainnet" | "testnet"): Promise<ClientLight> {
  if (startPromise && currentNetwork !== network) {
    await stopLightClient()
  }

  if (!startPromise) {
    const isMainnet = network === "mainnet"
    const networkSetting: NetworkSetting = isMainnet
      ? { type: "MainNet" as const, config: getLightNodeConfig("mainnet") }
      : { type: "TestNet" as const, config: getLightNodeConfig("testnet") }

    lightClientWasm = new LightClient()
    currentNetwork = network

    const secretKey = "0x0000000000000000000000000000000000000000000000000000000000000001"
    startPromise = lightClientWasm.start(networkSetting, secretKey, "error", "ws")
  }

  const timeoutPromise = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error("Light Client failed to start within 30 seconds")), 30000)
  )

  await Promise.race([startPromise, timeoutPromise])
  return new ClientLight(network, lightClientWasm!)
}

export async function stopLightClient(): Promise<void> {
  if (lightClientWasm) {
    await lightClientWasm.stop()
    lightClientWasm = null
    startPromise = null
    currentNetwork = null
  }
}

export async function ensureScripts(scripts: Array<ScriptLike | ScriptInfoLike>) {
  if (!lightClientWasm) return

  const existingScripts = await lightClientWasm.getScripts()
  const existingHashes = new Set(existingScripts.map((s) => Script.from(s.script).hash()))

  const newScripts = scripts
    .map((s) => Script.from("script" in s ? s.script : s))
    .filter((script) => !existingHashes.has(script.hash()))

  if (newScripts.length === 0) return

  const tip = await lightClientWasm.getTipHeader()
  const startBlock = tip.number > numFrom(100) ? tip.number - numFrom(100) : numFrom(0)

  const newStatuses = newScripts.map((script) => ({
    script,
    scriptType: "lock" as const,
    blockNumber: startBlock,
  }))

  await lightClientWasm.setScripts(newStatuses, LightClientSetScriptsCommand.Partial)
}

export { LightClientSetScriptsCommand }
