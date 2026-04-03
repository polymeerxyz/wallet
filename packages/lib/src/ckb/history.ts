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
  CLAIM_DAO = "claim_dao",
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
        const previousCell = await client.getCell(input.previousOutput)
        if (previousCell) {
          baseAmount += previousCell.cellOutput.capacity
          if (daoScriptInfo && previousCell.cellOutput.type?.codeHash === daoScriptInfo.codeHash) {
            hasDaoInput = true
          }
        }
      })
    )
  }

  let finalAmount = baseAmount
  let foundSelfOutput = false

  txResponse.transaction.outputs.forEach((output: { lock: Script; capacity: bigint; type?: Script }, index: number) => {
    // Check if the output belongs to any of our derived lock scripts
    const outputHash = output.lock.hash()
    if (lockScripts[outputHash]) {
      foundSelfOutput = true
      const isDaoOutput = daoScriptInfo && output.type?.codeHash === daoScriptInfo.codeHash

      if (isDaoOutput) {
        const data = txResponse.transaction.outputsData[index]
        if (data === "0x0000000000000000") {
          txType = TransactionType.DEPOSIT_DAO
        } else {
          txType = TransactionType.WITHDRAW_DAO
        }
        isNegative = false
        finalAmount = output.capacity
      } else if (hasDaoInput) {
        txType = TransactionType.CLAIM_DAO
        isNegative = false
        finalAmount = output.capacity
      } else {
        finalAmount = isNegative ? baseAmount - output.capacity : output.capacity
      }
    }
  })

  if (isNegative && !foundSelfOutput) {
    finalAmount = baseAmount
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

  // Fetch all transactions for all scripts (paginated by individual cursors)
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

  // Process unique transactions
  const summaries = Array.from(allTxSummaries.values())
  const processed = await Promise.all(
    summaries.map((tx) => processTransactionSummary(client, tx, lockScriptsMap, daoScriptInfo))
  )

  const validTxs = processed.filter(Boolean) as TransactionHistoryItem[]

  // Sort descending by block number
  validTxs.sort((a, b) => Number(BigInt(b.blockNumber) - BigInt(a.blockNumber)))

  return { transactions: validTxs, cursors: nextCursors }
}
