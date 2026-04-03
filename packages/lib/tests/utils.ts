import type { Script, Transaction } from "@ckb-ccc/core"

export interface TxScript {
  codeHash: string
  hashType: "data" | "type" | "data1" | "data2"
  args: string
}

export interface TxOutPoint {
  txHash: string
  index: string
}

export interface TxCell {
  cellOutput: {
    capacity: string
    lock: TxScript
    type?: TxScript | null
  }
  data: string
  outPoint?: TxOutPoint
  blockHash?: string
  blockNumber?: string
}

export interface TxSkeleton {
  cellProvider: any
  cellDeps: Array<{
    outPoint: TxOutPoint
    depType: "code" | "depGroup"
  }>
  headerDeps: string[]
  inputs: TxCell[]
  outputs: TxCell[]
  witnesses: string[]
  fixedEntries: Array<{ field: string; index: number }>
  signingEntries: Array<{ type: string; index: number; message: string }>
  inputSinces: Map<number, string> | Record<number, string>
}

export function cccTxToSkeleton(tx: Transaction): TxSkeleton {
  const scriptToLumos = (s?: Script | null): TxScript | null => {
    if (!s) return null
    return {
      codeHash: s.codeHash,
      hashType: s.hashType,
      args: s.args,
    }
  }

  const cellDeps = tx.cellDeps.map((cd) => ({
    outPoint: {
      txHash: cd.outPoint.txHash,
      index: `0x${cd.outPoint.index.toString(16)}`,
    },
    depType: cd.depType as "code" | "depGroup",
  }))

  const inputs = tx.inputs.map((input) => {
    if (!input.cellOutput) {
      throw new Error("Input cell output is missing. This transaction must be enriched with context.")
    }

    const res: TxCell = {
      cellOutput: {
        capacity: `0x${input.cellOutput.capacity.toString(16)}`,
        lock: scriptToLumos(input.cellOutput.lock)!,
        type: scriptToLumos(input.cellOutput.type),
      },
      data: input.outputData ?? "0x",
      outPoint: {
        txHash: input.previousOutput.txHash,
        index: `0x${input.previousOutput.index.toString(16)}`,
      },
    }

    const enrichedInput = input as { blockNumber?: bigint; blockHash?: string }
    if (enrichedInput.blockNumber) {
      res.blockNumber = `0x${enrichedInput.blockNumber.toString(16)}`
    }
    if (enrichedInput.blockHash) {
      res.blockHash = enrichedInput.blockHash
    }

    return res
  })

  const outputs: TxCell[] = tx.outputs.map((output, i) => ({
    cellOutput: {
      capacity: `0x${output.capacity.toString(16)}`,
      lock: scriptToLumos(output.lock)!,
      type: scriptToLumos(output.type),
    },
    data: tx.outputsData[i] || "0x",
  }))

  const inputSinces: Record<number, string> = {}
  tx.inputs.forEach((input, i) => {
    if (input.since !== 0n) {
      inputSinces[i] = `0x${input.since.toString(16)}`
    }
  })

  return {
    cellProvider: null,
    cellDeps,
    headerDeps: tx.headerDeps,
    inputs,
    outputs,
    witnesses: tx.witnesses,
    fixedEntries: [],
    signingEntries: [],
    inputSinces,
  }
}
