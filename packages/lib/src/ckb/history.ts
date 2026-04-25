import type { Client, Script } from "@ckb-ccc/core"
import { KnownScript } from "@ckb-ccc/core"
import dayjs from "dayjs"

export enum TransactionType {
  SEND_NATIVE_TOKEN = "send_ckb",
  RECEIVE_NATIVE_TOKEN = "receive_ckb",
  SEND_TOKEN = "send_token",
  RECEIVE_TOKEN = "receive_token",
  DEPOSIT_DAO = "deposit_dao",
  WITHDRAW_DAO = "withdraw_dao",
  UNLOCK_DAO = "unlock_dao",
}

export interface TransactionHistoryItem {
  hash: string
  type: TransactionType
  amount: string
  date: string
  status: string
  blockNumber: string
}

export interface CellInfo {
  isInput: boolean
  cellIndex: number | string
}

export interface TxSummary {
  txHash: string
  blockNumber: { toString(): string }
  cells: CellInfo[]
}

export async function processTransactionSummary(
  client: Client,
  txSummary: TxSummary,
  lockScripts: Record<string, boolean>,
  daoScriptInfo: Pick<Script, "codeHash" | "hashType"> | null
): Promise<TransactionHistoryItem | null> {
  const hash = txSummary.txHash
  const blockNumber = txSummary.blockNumber.toString()

  const txResponse = await client.getTransaction(hash)
  if (!txResponse) return null

  const status = txResponse.status

  let timestamp = ""
  if (txResponse.blockHash) {
    const header = await client.getHeaderByHash(txResponse.blockHash)
    if (header) {
      timestamp = dayjs(Number(header.timestamp)).format("YYYY-MM-DD HH:mm:ss")
    }
  }

  let txType = TransactionType.RECEIVE_NATIVE_TOKEN
  let baseAmount = 0n
  let isNegative = false
  let hasDaoInput = false

  const selfInputs = txSummary.cells.filter((c: CellInfo) => c.isInput)
  if (selfInputs.length > 0) {
    isNegative = true
    txType = TransactionType.SEND_NATIVE_TOKEN
    await Promise.all(
      selfInputs.map(async (cellInfo: CellInfo) => {
        const input = txResponse.transaction.inputs[Number(cellInfo.cellIndex)]
        const prevTx = await client.getTransaction(input.previousOutput.txHash)
        if (prevTx) {
          const previousOutput = prevTx.transaction.outputs[Number(input.previousOutput.index)]
          if (previousOutput) {
            baseAmount += previousOutput.capacity
            if (daoScriptInfo && previousOutput.type?.codeHash === daoScriptInfo.codeHash) {
              hasDaoInput = true
            }
          }
        }
      })
    )
  }

  let finalAmount: bigint
  let hasDaoOutput = false
  let isDaoDeposit = false
  let daoOutputCapacity = 0n
  let standardOutputCapacity = 0n
  let foundSelfOutput = false

  txResponse.transaction.outputs.forEach((output: { lock: Script; capacity: bigint; type?: Script }, index: number) => {
    const outputHash = output.lock.hash()
    if (lockScripts[outputHash]) {
      foundSelfOutput = true
      const isDao = daoScriptInfo && output.type?.codeHash === daoScriptInfo.codeHash

      if (isDao) {
        hasDaoOutput = true
        daoOutputCapacity += output.capacity
        const data = txResponse.transaction.outputsData[index]
        if (data === "0x0000000000000000") {
          isDaoDeposit = true
        }
      } else {
        standardOutputCapacity += output.capacity
      }
    }
  })

  if (hasDaoOutput) {
    if (isDaoDeposit) {
      txType = TransactionType.DEPOSIT_DAO
      finalAmount = daoOutputCapacity
    } else {
      txType = TransactionType.WITHDRAW_DAO
      finalAmount = 0n
    }
  } else if (hasDaoInput) {
    txType = TransactionType.UNLOCK_DAO
    finalAmount = standardOutputCapacity
  } else {
    if (isNegative && !foundSelfOutput) {
      finalAmount = baseAmount
    } else {
      finalAmount = isNegative ? baseAmount - standardOutputCapacity : standardOutputCapacity
    }
  }

  return {
    hash,
    type: txType,
    amount: finalAmount.toString(),
    date: timestamp || "Pending",
    status: status.toUpperCase(),
    blockNumber,
  }
}

export async function getTransactions(client: Client, scripts: Script[], cursors: Record<string, string> = {}) {
  if (scripts.length === 0) return { transactions: [], cursors: {} }

  const daoScriptInfo = await client.getKnownScript(KnownScript.NervosDao)
  const lockScriptsMap: Record<string, boolean> = {}
  scripts.forEach((s) => (lockScriptsMap[s.hash()] = true))

  const allTxSummaries = new Map<string, TxSummary>()
  const nextCursors: Record<string, string> = {}

  await Promise.all(
    scripts.map(async (script) => {
      const scriptHash = script.hash()
      const { transactions, lastCursor } = await client.findTransactionsPaged(
        {
          script: script,
          scriptType: "lock",
          scriptSearchMode: "exact",
          groupByTransaction: true,
        },
        "desc",
        20,
        cursors[scriptHash]
      )

      nextCursors[scriptHash] = lastCursor || ""

      transactions.forEach((tx: unknown) => {
        const t = tx as TxSummary
        if (!allTxSummaries.has(t.txHash)) {
          allTxSummaries.set(t.txHash, t)
        }
      })
    })
  )

  const summaries = Array.from(allTxSummaries.values())
  const processed = await Promise.all(
    summaries.map((tx) => processTransactionSummary(client, tx, lockScriptsMap, daoScriptInfo))
  )

  const validTxs = processed.filter(Boolean) as TransactionHistoryItem[]

  validTxs.sort((a, b) => Number(BigInt(b.blockNumber) - BigInt(a.blockNumber)))

  return { transactions: validTxs, cursors: nextCursors }
}
