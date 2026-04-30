import type {
  Cell,
  Client,
  ClientBlockHeader,
  ClientIndexerSearchKeyLike,
  ClientTransactionResponse,
  Epoch,
  Hex,
  NumLike,
  TransactionLike,
} from "@ckb-ccc/core"
import { bytesFrom, hashCkb, numFrom, numToHex, Script, Transaction } from "@ckb-ccc/core"

const BROADCAST_CHANNEL = "ckb-rpc-proxy"

type GetClientFn = () => Promise<Client>
type OnScriptFn = (scripts: Script[]) => Promise<void>

interface ProxyRequest {
  type: "request"
  proxyId: string
  method: string
  params: unknown[]
}

interface CkbRpcScript {
  code_hash: Hex
  hash_type: "data" | "type" | "data1" | "data2"
  args: Hex
}

interface CkbRpcSearchKey {
  script: CkbRpcScript
  script_type: "lock" | "type"
  filter?: {
    script?: CkbRpcScript
    output_data_len_range?: [string, string]
    output_capacity_range?: [string, string]
    block_range?: [string, string]
  }
  script_search_mode?: "prefix" | "exact" | "partial"
}

// CKB epoch packed uint64: bits 0-23 = epoch number, 24-39 = index, 40-55 = length
function packEpoch(epoch: Epoch): string {
  const [number, index, length] = epoch
  return numToHex((BigInt(length) << 40n) | (BigInt(index) << 24n) | BigInt(number))
}

function rpcToScript(rpc: CkbRpcScript): Script {
  return Script.from({
    codeHash: rpc.code_hash,
    hashType: rpc.hash_type,
    args: rpc.args,
  })
}

function scriptToRpc(script: Script) {
  return {
    code_hash: script.codeHash,
    hash_type: script.hashType,
    args: script.args,
  }
}

function headerToRpc(h: ClientBlockHeader) {
  return {
    compact_target: numToHex(h.compactTarget),
    dao: {
      ar: numToHex(h.dao.ar),
      c: numToHex(h.dao.c),
      s: numToHex(h.dao.s),
      u: numToHex(h.dao.u),
    },
    epoch: packEpoch(h.epoch),
    extra_hash: h.extraHash,
    hash: h.hash,
    nonce: numToHex(h.nonce),
    number: numToHex(h.number),
    parent_hash: h.parentHash,
    proposals_hash: h.proposalsHash,
    timestamp: numToHex(h.timestamp),
    transactions_root: h.transactionsRoot,
    version: numToHex(h.version),
  }
}

function cellToRpc(cell: Cell, verbosity: number) {
  const res = {
    output: {
      capacity: numToHex(cell.cellOutput.capacity),
      lock: scriptToRpc(cell.cellOutput.lock),
      type: cell.cellOutput.type ? scriptToRpc(cell.cellOutput.type) : null,
    },
    data: null as { hash: string; content?: string } | null,
  }

  if (verbosity >= 1) {
    const dataHash = hashCkb(bytesFrom(cell.outputData))
    res.data = {
      hash: dataHash,
    }
    if (verbosity >= 2) {
      res.data.content = cell.outputData
    }
  }

  return res
}

function txResponseToRpc(txRes: ClientTransactionResponse) {
  // Use Transaction.from() to ensure class instance with .hash() method
  const tx = Transaction.from(txRes.transaction)
  return {
    transaction: {
      version: numToHex(tx.version),
      cell_deps: tx.cellDeps.map((dep) => ({
        out_point: {
          tx_hash: dep.outPoint.txHash,
          index: numToHex(dep.outPoint.index),
        },
        dep_type: dep.depType === "depGroup" ? "dep_group" : dep.depType,
      })),
      header_deps: tx.headerDeps,
      inputs: tx.inputs.map((inp) => ({
        previous_output: {
          tx_hash: inp.previousOutput.txHash,
          index: numToHex(inp.previousOutput.index),
        },
        since: numToHex(inp.since),
      })),
      outputs: tx.outputs.map((out) => ({
        capacity: numToHex(out.capacity),
        lock: scriptToRpc(Script.from(out.lock)),
        type: out.type ? scriptToRpc(Script.from(out.type)) : null,
      })),
      outputs_data: tx.outputsData,
      witnesses: tx.witnesses,
      hash: tx.hash(),
    },
    cycles: txRes.cycles ? numToHex(txRes.cycles) : null,
    time_added_to_pool: null,
    tx_status: {
      block_hash: txRes.blockHash ?? null,
      block_number: txRes.blockNumber ? numToHex(txRes.blockNumber) : null,
      status: txRes.status,
    },
  }
}

function searchKeyToCcc(rpc: CkbRpcSearchKey): ClientIndexerSearchKeyLike {
  const key: ClientIndexerSearchKeyLike = {
    script: rpcToScript(rpc.script),
    scriptType: rpc.script_type,
    scriptSearchMode: rpc.script_search_mode ?? "prefix",
  }
  if (rpc.filter) {
    key.filter = {}
    if (rpc.filter.script) key.filter.script = rpcToScript(rpc.filter.script)
    if (rpc.filter.output_data_len_range) {
      key.filter.outputDataLenRange = rpc.filter.output_data_len_range.map((n) => numFrom(n)) as [NumLike, NumLike]
    }
    if (rpc.filter.output_capacity_range) {
      key.filter.outputCapacityRange = rpc.filter.output_capacity_range.map((n) => numFrom(n)) as [NumLike, NumLike]
    }
    if (rpc.filter.block_range) {
      key.filter.blockRange = rpc.filter.block_range.map((n) => numFrom(n)) as [NumLike, NumLike]
    }
  }
  return key
}

async function handleMethod(
  getClient: GetClientFn,
  method: string,
  params: unknown[],
  onScript?: OnScriptFn
): Promise<unknown> {
  const client = await getClient()

  switch (method) {
    case "get_tip_header": {
      return headerToRpc(await client.getTipHeader())
    }

    case "get_tip_block_number": {
      const h = await client.getTipHeader()
      return numToHex(h.number)
    }

    case "get_transaction": {
      const res = await client.getTransaction(params[0] as Hex)
      return res ? txResponseToRpc(res) : null
    }

    case "send_transaction": {
      return client.sendTransaction(params[0] as TransactionLike)
    }

    case "get_live_cell": {
      const op = params[0] as { tx_hash: string; index: string }
      const verbosity = (params[1] as number) ?? 2
      const cell = await client.getCellLive({ txHash: op.tx_hash as Hex, index: parseInt(op.index, 16) })
      if (!cell) return { cell: null, status: "dead" }
      return { cell: cellToRpc(cell, verbosity), status: "live" }
    }

    case "get_cells": {
      const searchKey = searchKeyToCcc(params[0] as CkbRpcSearchKey)
      if (onScript) {
        await onScript([Script.from(searchKey.script)])
      }
      const order = (params[1] as string) ?? "asc"
      const limit = params[2] ? numFrom(params[2] as string) : numFrom(100)
      const after = params[3] as string | undefined

      const res = await client.findCellsPaged(searchKey, order as "asc" | "desc", limit, after)
      return {
        last_cursor: res.lastCursor,
        objects: res.cells.map((c) => {
          const ic = c as Cell & { blockNumber?: bigint; txIndex?: bigint }
          return {
            out_point: {
              tx_hash: ic.outPoint.txHash,
              index: numToHex(ic.outPoint.index),
            },
            output: {
              capacity: numToHex(ic.cellOutput.capacity),
              lock: scriptToRpc(ic.cellOutput.lock),
              type: ic.cellOutput.type ? scriptToRpc(ic.cellOutput.type) : null,
            },
            output_data_len: numToHex(BigInt(bytesFrom(ic.outputData).length)),
            cell_output: {
              capacity: numToHex(ic.cellOutput.capacity),
              lock: scriptToRpc(ic.cellOutput.lock),
              type: ic.cellOutput.type ? scriptToRpc(ic.cellOutput.type) : null,
            },
            block_number: ic.blockNumber ? numToHex(ic.blockNumber) : null,
            tx_index: ic.txIndex ? numToHex(ic.txIndex) : null,
          }
        }),
      }
    }

    case "get_transactions": {
      const searchKey = searchKeyToCcc(params[0] as CkbRpcSearchKey)
      if (onScript) {
        await onScript([Script.from(searchKey.script)])
      }
      const order = (params[1] as string) ?? "asc"
      const limit = params[2] ? numFrom(params[2] as string) : numFrom(100)
      const after = params[3] as string | undefined

      const res = await client.findTransactionsPaged(searchKey, order as "asc" | "desc", limit, after)
      return {
        last_cursor: res.lastCursor,
        objects: res.transactions.map((t) => ({
          block_number: t.blockNumber ? numToHex(t.blockNumber) : null,
          tx_hash: t.txHash,
          tx_index: t.txIndex ? numToHex(t.txIndex) : null,
          io_index: "cellIndex" in t ? numToHex(t.cellIndex as bigint) : null,
          io_type: "isInput" in t ? (t.isInput ? "input" : "output") : null,
        })),
      }
    }

    case "get_header": {
      const h = await client.getHeaderByHash(params[0] as Hex)
      return h ? headerToRpc(h) : null
    }

    case "get_header_by_number": {
      const h = await client.getHeaderByNumber(numFrom(params[0] as string))
      return h ? headerToRpc(h) : null
    }

    case "get_block_median_time": {
      // Fiber uses this for since validation.
      try {
        const clientWithRpc = client as { rpc?: { request: (method: string, params: unknown[]) => Promise<unknown> } }
        if (clientWithRpc.rpc && typeof clientWithRpc.rpc.request === "function") {
          return await clientWithRpc.rpc.request("get_block_median_time", params)
        }
      } catch {
        // ignore
      }
      // Fallback: use tip timestamp
      const tip = await client.getTipHeader()
      return numToHex(tip.timestamp)
    }

    default:
      throw Object.assign(new Error(`Unsupported CKB RPC method: ${method}`), { code: -32601 })
  }
}

export function setupRpcProxyChannel(getClient: GetClientFn, onScript?: OnScriptFn): () => void {
  const channel = new BroadcastChannel(BROADCAST_CHANNEL)

  channel.onmessage = async (ev: MessageEvent<ProxyRequest>) => {
    if (ev.data?.type !== "request") return
    const { proxyId, method, params } = ev.data

    try {
      const result = await handleMethod(getClient, method, params, onScript)
      channel.postMessage({ type: "response", proxyId, result })
    } catch (err: unknown) {
      channel.postMessage({
        type: "response",
        proxyId,
        error: {
          code: (err as { code?: number }).code ?? -32000,
          message: err instanceof Error ? err.message : String(err),
        },
      })
    }
  }

  return () => channel.close()
}
