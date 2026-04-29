import type {
  ClientBlock,
  ClientBlockHeader,
  ClientFindCellsResponse,
  ClientFindTransactionsGroupedResponse,
  ClientFindTransactionsResponse,
  ClientIndexerSearchKeyLike,
  ClientIndexerSearchKeyTransactionLike,
  ClientTransactionResponse,
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
import { Cell, ClientJsonRpc, hexFrom, numFrom, OutPoint, RequestorJsonRpc, ScriptInfo } from "@ckb-ccc/core"
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

  constructor(network: "mainnet" | "testnet", lightClient: LightClient) {
    super("wasm://light-client", {
      requestor: new RequestorJsonRpc("wasm://light-client"),
    })
    this.clientNetwork = network
    this.lc = lightClient
  }

  get addressPrefix(): string {
    return this.clientNetwork === "mainnet" ? "ckb" : "ckt"
  }

  async getKnownScript(script: KnownScript): Promise<ScriptInfo> {
    const scripts = this.clientNetwork === "mainnet" ? MAINNET_SCRIPTS : TESTNET_SCRIPTS
    const found = scripts[script]
    if (!found) {
      throw new Error(`No script information was found for ${script} on ${this.addressPrefix}`)
    }
    return ScriptInfo.from(found)
  }

  getTip = async (): Promise<Num> => {
    const header = await this.lc.getTipHeader()
    return header.number
  }

  getTipHeader = async (): Promise<ClientBlockHeader> => {
    return this.lc.getTipHeader()
  }

  getHeaderByHashNoCache = async (
    blockHash: HexLike,
    _verbosity?: number | null
  ): Promise<ClientBlockHeader | undefined> => {
    return this.lc.getHeader(hexFrom(blockHash))
  }

  getHeaderByNumberNoCache = async (
    _blockNumber: NumLike,
    _verbosity?: number | null
  ): Promise<ClientBlockHeader | undefined> => {
    return undefined
  }

  getBlockByNumberNoCache = (
    _blockNumber: NumLike,
    _verbosity?: number | null,
    _withCycles?: boolean | null
  ): Promise<ClientBlock | undefined> => {
    return Promise.resolve(undefined)
  }

  getBlockByHashNoCache = (
    _blockHash: HexLike,
    _verbosity?: number | null,
    _withCycles?: boolean | null
  ): Promise<ClientBlock | undefined> => {
    return Promise.resolve(undefined)
  }

  getTransactionNoCache = async (txHash: HexLike): Promise<ClientTransactionResponse | undefined> => {
    return this.lc.getTransaction(hexFrom(txHash))
  }

  sendTransactionNoCache = async (transaction: TransactionLike, _validator?: OutputsValidator | null): Promise<Hex> => {
    return hexFrom(await this.lc.sendTransaction(transaction))
  }

  sendTransactionDry = (_transaction: TransactionLike, _validator?: OutputsValidator): Promise<Num> => {
    return Promise.resolve(numFrom(0))
  }

  estimateCycles = async (transaction: TransactionLike): Promise<Num> => {
    return this.lc.estimateCycles(transaction)
  }

  getFeeRateStatistics = async (_blockRange?: NumLike): Promise<{ mean: Num; median: Num }> => {
    return { mean: numFrom(1000), median: numFrom(1000) }
  }

  async getCellLiveNoCache(outPointLike: OutPointLike): Promise<Cell | undefined> {
    const outPoint = OutPoint.from(outPointLike)
    const txRes = await this.lc.getTransaction(outPoint.txHash)
    if (!txRes) return undefined

    const index = Number(numFrom(outPoint.index))
    const output = txRes.transaction.outputs[index]
    const outputData = txRes.transaction.outputsData[index]

    if (!output) return undefined

    return Cell.from({ cellOutput: output, outputData, outPoint })
  }

  findCellsPagedNoCache = async (
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

  getCellsCapacity = async (key: ClientIndexerSearchKeyLike): Promise<Num> => {
    return this.lc.getCellsCapacity(key)
  }

  override async getBalanceSingle(lock: ScriptLike): Promise<Num> {
    return this.getCellsCapacity({
      script: lock,
      scriptType: "lock",
      scriptSearchMode: "exact",
    })
  }

  findTransactionsPaged = (async (
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

  async fetchHeader(blockHash: HexLike): Promise<ClientBlockHeader | undefined> {
    const res: FetchResponse<ClientBlockHeader> = await this.lc.fetchHeader(hexFrom(blockHash))
    return res.status === "fetched" ? res.data : undefined
  }

  async fetchTransaction(txHash: HexLike): Promise<ClientTransactionResponse | undefined> {
    const res: FetchResponse<ClientTransactionResponse> = await this.lc.fetchTransaction(hexFrom(txHash))
    return res.status === "fetched" ? res.data : undefined
  }

  async setScripts(scripts: ScriptStatus[], command?: LightClientSetScriptsCommand): Promise<void> {
    return this.lc.setScripts(scripts, command)
  }

  async getScripts(): Promise<ScriptStatus[]> {
    return this.lc.getScripts()
  }

  async getSyncProgress(): Promise<number> {
    const header = await this.getTipHeader()
    const scripts = await this.getScripts()
    if (scripts.length === 0 || header.number === 0n) {
      return 100
    }
    const avgSynced = scripts.reduce((sum, s) => sum + Number(s.blockNumber), 0) / scripts.length
    return Math.min(100, Math.round((avgSynced / Number(header.number)) * 100))
  }
}
