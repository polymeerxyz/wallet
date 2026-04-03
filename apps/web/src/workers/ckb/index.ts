import { Cell, Script, stringify } from "@ckb-ccc/core"
import {
  buildDaoAction,
  buildDaoDeposit,
  buildSendCkbTransaction,
  getBalanceForScripts,
  getCell,
  getDaoAPY,
  getDaoCellInfo,
  getDaoCells,
  getSingleAddress,
  getTipHeader as getTipHeaderLib,
  getTransactions,
  prepareResult,
  scanUTXOAddresses,
  sendTransaction as sendTransactionLib,
} from "@polymeer/lib"

import { createClient } from "./client"
import type { WorkerRequest } from "./types"

let client = createClient("testnet")

self.onmessage = async (e) => {
  const data = e.data as WorkerRequest
  const { id, method, payload } = data

  try {
    let result
    switch (method) {
      case "SET_NETWORK": {
        client = createClient(payload.network)
        result = "OK"
        break
      }

      case "GET_ADDRESS_SINGLE": {
        result = await getSingleAddress(client, payload.publicKey, payload.chainCode, payload.isAccountBased)
        break
      }

      case "SCAN_UTXO": {
        result = await scanUTXOAddresses(client, payload.publicKey, payload.chainCode, payload.gapLimit || 20)
        break
      }

      case "GET_BALANCE": {
        const scripts = payload.scripts.map((s) => Script.from(s))
        result = await getBalanceForScripts(client, scripts)
        break
      }

      case "GET_TRANSACTIONS": {
        const scripts = payload.scripts.map((s) => Script.from(s))
        result = await getTransactions(client, scripts, payload.cursors)
        break
      }

      case "BUILD_SEND_CKB": {
        const scriptInfo = payload.scripts.map((s) => ({
          script: Script.from(s.script),
          path: s.path,
        }))

        const tx = await buildSendCkbTransaction(
          client,
          scriptInfo,
          payload.toAddress,
          payload.amount,
          BigInt(payload.feeRate || "100000")
        )
        const lockToPath = new Map<string, string>()
        scriptInfo.forEach((s) => lockToPath.set(s.script.hash(), s.path))

        result = await prepareResult(client, tx, lockToPath)
        break
      }

      case "GET_DAO_CELLS": {
        const scripts = payload.scripts.map((s) => Script.from(s))
        const cells = await getDaoCells(client, scripts)
        result = await Promise.all(
          cells.map(async (cell) => ({
            cell,
            info: await getDaoCellInfo(client, cell),
          }))
        )
        break
      }

      case "GET_DAO_APY":
        result = await getDaoAPY(client)
        break

      case "BUILD_DAO_DEPOSIT": {
        const scriptInfo = payload.scripts.map((s) => ({
          script: Script.from(s.script),
          path: s.path,
        }))

        const tx = await buildDaoDeposit(client, scriptInfo, payload.amount, BigInt(payload.feeRate || "100000"))
        const lockToPath = new Map<string, string>()
        scriptInfo.forEach((s) => lockToPath.set(s.script.hash(), s.path))

        result = await prepareResult(client, tx, lockToPath)
        break
      }

      case "BUILD_DAO_ACTION": {
        const scriptInfo = payload.scripts.map((s) => ({
          script: Script.from(s.script),
          path: s.path,
        }))
        const cell = Cell.from(payload.cell)

        const tx = await buildDaoAction(client, scriptInfo, cell, BigInt(payload.feeRate || "100000"))
        const lockToPath = new Map<string, string>()
        scriptInfo.forEach((s) => lockToPath.set(s.script.hash(), s.path))

        result = await prepareResult(client, tx, lockToPath)
        break
      }

      case "GET_CELL": {
        result = await getCell(client, payload.txHash, payload.index)
        break
      }
      case "GET_TIP_HEADER": {
        result = await getTipHeaderLib(client)
        break
      }

      case "SEND_TRANSACTION": {
        result = await sendTransactionLib(client, payload.tx)
        break
      }

      default:
        throw new Error(`Unknown method`)
    }
    self.postMessage({
      id,
      result: result !== undefined ? JSON.parse(stringify(result)) : undefined,
    })
  } catch (err: unknown) {
    self.postMessage({ id, error: err instanceof Error ? err.message : String(err) })
  }
}
