import type {
  CellDep,
  CellDepInfoLike,
  ClientBlock,
  ClientBlockHeader,
  ClientFindCellsResponse,
  ClientFindTransactionsGroupedResponse,
  ClientFindTransactionsResponse,
  ClientIndexerSearchKeyLike,
  ClientIndexerSearchKeyTransactionLike,
  Hex,
  HexLike,
  KnownScript,
  Num,
  NumLike,
  OutPointLike,
  OutputsValidator,
  ScriptLike,
  TransactionLike,
} from "@ckb-ccc/core"
import {
  Cell,
  ClientJsonRpc,
  ClientPublicMainnet,
  ClientPublicTestnet,
  ClientTransactionResponse,
  hexFrom,
  numFrom,
  RequestorJsonRpc,
  ScriptInfo,
} from "@ckb-ccc/core"
import { MAINNET_SCRIPTS, TESTNET_SCRIPTS } from "@ckb-ccc/core/advanced"
import type {
  FetchResponse,
  LightClient,
  LightClientSetScriptsCommand,
  ScriptStatus,
  TxWithCell,
  TxWithCells,
} from "ckb-light-client-js"

/**
 * CCC Client backed by ckb-light-client-js (WASM).
 * Every method with a WASM equivalent is overridden directly to avoid the
 * snake_case ↔ camelCase mismatch introduced by JsonRpcTransformers.
 * Full-node-only methods return safe no-op values.
 */
export class ClientLight extends ClientJsonRpc {
  private clientNetwork: "mainnet" | "testnet"
  private lc: LightClient
  private _fallback: ClientPublicMainnet | ClientPublicTestnet | null = null

  constructor(network: "mainnet" | "testnet", lightClient: LightClient) {
    super("wasm://light-client", {
      requestor: new RequestorJsonRpc("wasm://light-client"),
    })
    this.clientNetwork = network
    this.lc = lightClient
  }

  get fallback(): ClientPublicMainnet | ClientPublicTestnet {
    if (!this._fallback) {
      this._fallback = this.clientNetwork === "mainnet" ? new ClientPublicMainnet() : new ClientPublicTestnet()
    }
    return this._fallback
  }

  get addressPrefix(): string {
    return this.clientNetwork === "mainnet" ? "ckb" : "ckt"
  }

  override getKnownScript = async (script: KnownScript): Promise<ScriptInfo> => {
    const scripts = this.clientNetwork === "mainnet" ? MAINNET_SCRIPTS : TESTNET_SCRIPTS
    const found = scripts[script]
    if (!found) {
      throw new Error(`No script information was found for ${script} on ${this.addressPrefix}`)
    }
    return ScriptInfo.from(found)
  }

  override getFeeRateStatistics = (blockRange?: NumLike): Promise<{ mean: Num; median: Num }> => {
    return this.fallback.getFeeRateStatistics(blockRange)
  }

  override getTip = async (): Promise<Num> => {
    const header = await this.lc.getTipHeader()
    return header.number
  }

  override getTipHeader = (): Promise<ClientBlockHeader> => {
    return this.lc.getTipHeader()
  }

  override getBlockByNumberNoCache = (
    blockNumber: NumLike,
    verbosity?: number | null,
    withCycles?: boolean | null
  ): Promise<ClientBlock | undefined> => {
    return this.fallback.getBlockByNumberNoCache(blockNumber, verbosity, withCycles)
  }

  override getBlockByHashNoCache = (
    blockHash: HexLike,
    verbosity?: number | null,
    withCycles?: boolean | null
  ): Promise<ClientBlock | undefined> => {
    return this.fallback.getBlockByHashNoCache(blockHash, verbosity, withCycles)
  }

  override getHeaderByNumberNoCache = async (
    blockNumber: NumLike,
    verbosity?: number | null
  ): Promise<ClientBlockHeader | undefined> => {
    return this.fallback.getHeaderByNumberNoCache(blockNumber, verbosity)
  }

  override getHeaderByHashNoCache = async (
    blockHash: HexLike,
    _verbosity?: number | null
  ): Promise<ClientBlockHeader | undefined> => {
    const cached = await this.lc.getHeader(hexFrom(blockHash))
    if (cached) return cached
    return this.fallback.getHeaderByHashNoCache(blockHash)
  }

  override estimateCycles = (transaction: TransactionLike): Promise<Num> => {
    return this.lc.estimateCycles(transaction)
  }

  override sendTransactionDry = (transaction: TransactionLike, validator?: OutputsValidator): Promise<Num> => {
    return this.fallback.sendTransactionDry(transaction, validator)
  }

  override sendTransactionNoCache = (
    transaction: TransactionLike,
    _validator?: OutputsValidator | null
  ): Promise<Hex> => {
    return this.lc.sendTransaction(transaction)
  }

  override getTransactionNoCache = async (txHash: HexLike): Promise<ClientTransactionResponse | undefined> => {
    const res = await this.lc.getTransaction(hexFrom(txHash))
    if (!res) return undefined
    return ClientTransactionResponse.from(res)
  }

  override getCellLiveNoCache = (outPointLike: OutPointLike): Promise<Cell | undefined> => {
    return this.fallback.getCellLiveNoCache(outPointLike)
  }

  override findCellsPagedNoCache = async (
    key: ClientIndexerSearchKeyLike,
    order?: "asc" | "desc",
    limit?: NumLike,
    after?: string
  ): Promise<ClientFindCellsResponse> => {
    const res = await this.lc.getCells(key, order, limit, after as Hex)
    return {
      lastCursor: res.lastCursor,
      cells: res.cells.map((c) =>
        Cell.from({
          outPoint: c.outPoint,
          cellOutput: c.cellOutput,
          outputData: c.outputData,
        })
      ),
    }
  }

  override findTransactionsPaged = (async (
    key: ClientIndexerSearchKeyTransactionLike,
    order?: "asc" | "desc",
    limit?: NumLike,
    after?: string
  ): Promise<ClientFindTransactionsResponse | ClientFindTransactionsGroupedResponse> => {
    const res = await this.lc.getTransactions(key, order, limit, after as Hex)
    if (res.transactions.length === 0) {
      return { lastCursor: res.lastCursor, transactions: [] } as ClientFindTransactionsResponse
    }
    if ("ioIndex" in res.transactions[0]) {
      const txs = res.transactions as TxWithCell[]
      return {
        lastCursor: res.lastCursor,
        transactions: txs.map((t) => ({
          txHash: hexFrom(t.transaction.hash()),
          blockNumber: t.blockNumber,
          txIndex: t.txIndex,
          cellIndex: t.ioIndex,
          isInput: t.ioType === "input",
        })),
      } as ClientFindTransactionsResponse
    }

    const txs = res.transactions as TxWithCells[]
    return {
      lastCursor: res.lastCursor,
      transactions: txs.map((t) => ({
        txHash: hexFrom(t.transaction.hash()),
        blockNumber: t.blockNumber,
        txIndex: t.txIndex,
        cells: t.cells.map(([type, i]) => ({
          isInput: type === "input",
          cellIndex: numFrom(i),
        })),
      })),
    } as ClientFindTransactionsGroupedResponse
  }) as ClientJsonRpc["findTransactionsPaged"]

  override getCellsCapacity = (key: ClientIndexerSearchKeyLike): Promise<Num> => {
    return this.lc.getCellsCapacity(key)
  }

  override getCellDeps = (...cellDepInfoLikes: CellDepInfoLike[][]): Promise<CellDep[]> => {
    return this.fallback.getCellDeps(...cellDepInfoLikes)
  }

  override getBalanceSingle = (lock: ScriptLike): Promise<Num> => {
    return this.getCellsCapacity({
      script: lock,
      scriptType: "lock",
      scriptSearchMode: "exact",
    })
  }

  fetchHeader = async (blockHash: HexLike): Promise<ClientBlockHeader | undefined> => {
    const res: FetchResponse<ClientBlockHeader> = await this.lc.fetchHeader(hexFrom(blockHash))
    return res.status === "fetched" ? res.data : undefined
  }

  fetchTransaction = async (txHash: HexLike): Promise<ClientTransactionResponse | undefined> => {
    const res: FetchResponse<ClientTransactionResponse> = await this.lc.fetchTransaction(hexFrom(txHash))
    return res.status === "fetched" ? res.data : undefined
  }

  setScripts = (scripts: ScriptStatus[], command?: LightClientSetScriptsCommand): Promise<void> => {
    return this.lc.setScripts(scripts, command)
  }

  getScripts = (): Promise<ScriptStatus[]> => {
    return this.lc.getScripts()
  }

  getSyncProgress = async (): Promise<number> => {
    const header = await this.getTipHeader()
    const scripts = await this.getScripts()
    if (scripts.length === 0 || header.number === 0n) {
      return 100
    }
    const avgSynced = scripts.reduce((sum, s) => sum + Number(s.blockNumber), 0) / scripts.length
    return Math.min(100, Math.round((avgSynced / Number(header.number)) * 100))
  }
}
