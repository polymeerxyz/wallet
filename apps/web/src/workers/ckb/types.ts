import type { CellLike, ClientBlockHeaderLike, EpochLike, ScriptLike, TransactionLike } from "@ckb-ccc/core"

export type WorkerMethod =
  | "UPDATE_CONFIG"
  | "GET_ADDRESS_SINGLE"
  | "SCAN_UTXO"
  | "GET_BALANCE"
  | "GET_TRANSACTIONS"
  | "BUILD_SEND_CKB"
  | "GET_DAO_CELLS"
  | "GET_DAO_APY"
  | "BUILD_DAO_DEPOSIT"
  | "BUILD_DAO_ACTION"
  | "GET_CELL"
  | "GET_TIP_HEADER"
  | "GET_SYNC_PROGRESS"
  | "SEND_TRANSACTION"

export interface ScriptInfoLike {
  script: ScriptLike
  path: string
}

export interface AddressResult {
  address: string
  scripts: ScriptInfoLike[]
}

export interface ScanResult {
  latestUnusedAddress: string
  scripts: ScriptInfoLike[]
}

export interface TransactionHistoryItem {
  hash: string
  type: string
  amount: string
  date: string
  status: string
  blockNumber: string
}

export interface TransactionResult {
  transactions: TransactionHistoryItem[]
  cursors: Record<string, string>
}

export interface BuildResult {
  tx: TransactionLike
  signPaths: string[]
  fee: string
  contexts: TransactionLike[]
  witnesses: string[]
}

export interface ConfigPayload {
  network: "mainnet" | "testnet"
  clientMode: "light" | "full"
}

export interface GetAddressSinglePayload {
  publicKey: string
  chainCode: string
  isAccountBased: boolean
}

export interface ScanUtxoPayload {
  publicKey: string
  chainCode: string
  gapLimit?: number
}

export interface GetBalancePayload {
  scripts: ScriptLike[]
}

export interface GetTransactionsPayload {
  scripts: ScriptLike[]
  cursors?: Record<string, string>
}

export interface GetCellPayload {
  txHash: string
  index: number
}

export interface BuildSendCkbPayload {
  scripts: ScriptInfoLike[]
  toAddress: string
  amount: string | "max"
  feeRate?: string
}

export interface DaoCellInfo {
  cell: CellLike
  info: {
    type: "deposit" | "withdraw"
    profit: string
    depositHeader: ClientBlockHeaderLike
    withdrawHeader?: ClientBlockHeaderLike
    tipHeader: ClientBlockHeaderLike
    targetEpoch: EpochLike
  } | null
}

export interface DaoActionPayload {
  scripts: ScriptInfoLike[]
  cell: CellLike
  feeRate?: string
}

export interface DaoDepositPayload {
  scripts: ScriptInfoLike[]
  amount: string
  feeRate?: string
}

export interface SendTransactionPayload {
  tx: TransactionLike
}

export interface WorkerTypeMap {
  UPDATE_CONFIG: { payload: ConfigPayload; result: Record<string, never> }
  GET_ADDRESS_SINGLE: { payload: GetAddressSinglePayload; result: AddressResult }
  SCAN_UTXO: { payload: ScanUtxoPayload; result: ScanResult }
  GET_BALANCE: { payload: GetBalancePayload; result: string }
  GET_TRANSACTIONS: { payload: GetTransactionsPayload; result: TransactionResult }
  BUILD_SEND_CKB: { payload: BuildSendCkbPayload; result: BuildResult }
  GET_DAO_CELLS: { payload: GetBalancePayload; result: DaoCellInfo[] }
  GET_DAO_APY: { payload: Record<string, never>; result: string }
  BUILD_DAO_DEPOSIT: { payload: DaoDepositPayload; result: BuildResult }
  BUILD_DAO_ACTION: { payload: DaoActionPayload; result: BuildResult }
  GET_CELL: { payload: GetCellPayload; result: CellLike | null }
  GET_TIP_HEADER: { payload: Record<string, never>; result: ClientBlockHeaderLike }
  GET_SYNC_PROGRESS: { payload: Record<string, never>; result: number }
  SEND_TRANSACTION: { payload: SendTransactionPayload; result: string }
}

export type WorkerRequest = {
  [M in WorkerMethod]: {
    id: number
    method: M
    payload: WorkerTypeMap[M]["payload"]
  }
}[WorkerMethod]

export type WorkerResponse = {
  [M in WorkerMethod]: {
    id: number
    result?: WorkerTypeMap[M]["result"]
    error?: string
  }
}[WorkerMethod]
