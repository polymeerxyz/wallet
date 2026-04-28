import type { Client, Hex } from "@ckb-ccc/core"
import { Cell, ClientPublicMainnet, ClientPublicTestnet, KnownScript, numFrom, Script } from "@ckb-ccc/core"
import type { ClientLight } from "@polymeer/lib"
import {
  buildDaoAction,
  buildDaoDeposit,
  buildFiberFunding,
  buildSendCkbTransaction,
  getBalanceForScripts,
  getDaoAPY,
  getDaoCellInfo,
  getSingleAddress,
  getTransactions,
  prepareResult,
  scanUTXOAddresses,
} from "@polymeer/lib"

import type { DaoCellInfo, WorkerMethod, WorkerRequest, WorkerResponse, WorkerTypeMap } from "./types"
import { toSerializable } from "./utils"

let currentNetwork: "mainnet" | "testnet"
let currentClientMode: "light" | "full"

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

async function getActiveClient(network: "mainnet" | "testnet"): Promise<Client> {
  if (!currentNetwork) {
    throw new Error("Worker not initialized. Call UPDATE_CONFIG first.")
  }

  if (currentClientMode === "full") return network === "mainnet" ? new ClientPublicMainnet() : new ClientPublicTestnet()
  const { startLightClient } = await import("./client")
  return startLightClient(network)
}

async function handleMessage(request: WorkerRequest): Promise<WorkerTypeMap[WorkerMethod]["result"]> {
  const { method, payload } = request

  if (method === "UPDATE_CONFIG") {
    const prevMode = currentClientMode
    const prevNetwork = currentNetwork

    currentClientMode = payload.clientMode
    currentNetwork = payload.network

    console.log(`[Worker] Updating config: mode=${currentClientMode}, network=${currentNetwork}`)

    if (currentClientMode === "full") {
      if (prevMode === "light" || prevNetwork !== currentNetwork) {
        const { stopLightClient } = await import("./client")
        await stopLightClient()
      }
    } else {
      const { startLightClient } = await import("./client")
      await startLightClient(currentNetwork)
    }
    return {}
  }

  const client = await getActiveClient(currentNetwork)

  if (currentClientMode === "light" && "scripts" in payload && Array.isArray(payload.scripts)) {
    const { ensureScripts } = await import("./client")
    await ensureScripts(payload.scripts)
  }

  switch (method) {
    case "GET_ADDRESS_SINGLE":
      return getSingleAddress(client, payload.publicKey, payload.chainCode, payload.isAccountBased)

    case "SCAN_UTXO": {
      const res = await scanUTXOAddresses(client, payload.publicKey, payload.chainCode, payload.gapLimit ?? 20)
      if (currentClientMode === "light") {
        const { ensureScripts } = await import("./client")
        await ensureScripts(res.scripts)
      }
      return res
    }

    case "GET_BALANCE":
      return getBalanceForScripts(
        client,
        payload.scripts.map((s) => Script.from(s))
      )

    case "GET_TRANSACTIONS":
      return getTransactions(
        client,
        payload.scripts.map((s) => Script.from(s)),
        payload.cursors
      )

    case "BUILD_SEND_CKB": {
      const tx = await buildSendCkbTransaction(
        client,
        payload.scripts.map((s) => ({ script: Script.from(s.script), path: s.path })),
        payload.toAddress,
        payload.amount,
        payload.feeRate ? numFrom(payload.feeRate) : undefined
      )
      const lockToPath = new Map(payload.scripts.map((s) => [Script.from(s.script).hash(), s.path]))
      return prepareResult(client, tx, lockToPath)
    }

    case "GET_DAO_CELLS": {
      const cells: DaoCellInfo[] = []
      for await (const cell of client.findCellsByLock(Script.from(payload.scripts[0]))) {
        const info = await getDaoCellInfo(client, cell)
        if (info) {
          cells.push({
            cell: toSerializable(cell),
            info: toSerializable(info),
          } as DaoCellInfo)
        }
      }
      return cells
    }

    case "GET_DAO_APY":
      return getDaoAPY(client)

    case "BUILD_DAO_DEPOSIT": {
      const tx = await buildDaoDeposit(
        client,
        payload.scripts.map((s) => ({ script: Script.from(s.script), path: s.path })),
        payload.amount,
        payload.feeRate ? numFrom(payload.feeRate) : undefined
      )
      const lockToPath = new Map(payload.scripts.map((s) => [Script.from(s.script).hash(), s.path]))
      return prepareResult(client, tx, lockToPath)
    }

    case "BUILD_DAO_ACTION": {
      const tx = await buildDaoAction(
        client,
        payload.scripts.map((s) => ({ script: Script.from(s.script), path: s.path })),
        Cell.from(payload.cell),
        payload.feeRate ? numFrom(payload.feeRate) : undefined
      )
      const lockToPath = new Map(payload.scripts.map((s) => [Script.from(s.script).hash(), s.path]))
      return prepareResult(client, tx, lockToPath)
    }

    case "BUILD_FIBER_FUNDING": {
      const lockToPath = new Map(payload.scripts.map((s) => [Script.from(s.script).hash(), s.path]))
      return buildFiberFunding(client, payload.tx, lockToPath)
    }

    case "SEND_TRANSACTION":
      return client.sendTransaction(payload.tx)

    case "GET_TIP_HEADER": {
      const header = await client.getTipHeader()
      return toSerializable(header)
    }

    case "GET_SYNC_PROGRESS": {
      if (currentClientMode === "light" && "getSyncProgress" in client) {
        return (client as ClientLight).getSyncProgress()
      }
      return 100
    }

    case "GET_CELL": {
      const cell = await client.getCell({ txHash: payload.txHash, index: payload.index })
      return cell ? toSerializable(cell) : null
    }

    case "GET_FUNDING_LOCK_CELL_DEPS": {
      const lockScript = Script.from(payload.script)
      const LOCK_SCRIPTS = [
        KnownScript.Secp256k1Blake160,
        KnownScript.Secp256k1Multisig,
        KnownScript.AnyoneCanPay,
        KnownScript.JoyId,
        KnownScript.OmniLock,
        KnownScript.PWLock,
      ]

      for (const knownScript of LOCK_SCRIPTS) {
        let scriptInfo
        try {
          scriptInfo = await client.getKnownScript(knownScript)
        } catch {
          continue
        }

        if (scriptInfo.codeHash !== lockScript.codeHash || scriptInfo.hashType !== lockScript.hashType) {
          continue
        }

        const cellDeps = await client.getCellDeps(scriptInfo.cellDeps)
        return cellDeps.map((cellDep) => ({
          dep_type: (cellDep.depType === "depGroup" ? "dep_group" : "code") as "code" | "dep_group",
          out_point: {
            tx_hash: cellDep.outPoint.txHash as Hex,
            index: ("0x" + cellDep.outPoint.index.toString(16)) as Hex,
          },
        }))
      }

      return []
    }

    default: {
      const exhaustiveCheck: never = method
      throw new Error(`Method ${exhaustiveCheck} not supported`)
    }
  }
}
