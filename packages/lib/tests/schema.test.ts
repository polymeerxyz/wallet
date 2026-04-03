import type {
  CellDepLike,
  CellInputLike,
  CellOutputLike,
  OutPointLike,
  ScriptLike,
  TransactionLike,
} from "@ckb-ccc/core"
import { hexFrom, numFrom, Since } from "@ckb-ccc/core"
import { SerializeAnnotatedTransaction } from "@magickbase/hw-app-ckb/lib/annotated"
import { describe, expect, it } from "vitest"

import { buildAnnotatedTransaction } from "../src/hardware/ledger/ledger"
import type {
  AnnotatedRawTransaction,
  AnnotatedTransaction as AnnotatedTransactionType,
} from "../src/hardware/ledger/model"
import { AnnotatedTransaction as AnnotatedTransactionCodec } from "../src/hardware/ledger/schema"
import { changePath, contexts, signPath, transaction, witnesses } from "./fixtures"

function toLegacyAnnotatedTransaction(tx: AnnotatedTransactionType): Record<string, unknown> {
  const mapScript = (s: ScriptLike | undefined) => {
    if (!s) return undefined
    return {
      code_hash: s.codeHash,
      hash_type: s.hashType === "depGroup" ? "dep_group" : s.hashType,
      args: s.args,
    }
  }

  const mapOutPoint = (op: OutPointLike) => {
    const tx_hash = op.txHash
    const index = Number(numFrom(op.index))
    return { tx_hash, index }
  }

  const mapCellDep = (cd: CellDepLike) => ({
    out_point: mapOutPoint(cd.outPoint),
    dep_type: cd.depType === "depGroup" ? "dep_group" : cd.depType,
  })

  const mapInput = (i: CellInputLike) => {
    const since =
      typeof i.since === "object" && i.since !== null && "value" in i.since
        ? Since.from(i.since).toNum()
        : numFrom(i.since ?? 0)
    return {
      since: `0x${since.toString(16)}`,
      previous_output: mapOutPoint("previousOutput" in i ? i.previousOutput : i.outPoint),
    }
  }

  const mapOutput = (o: CellOutputLike) => ({
    capacity: `0x${numFrom(o.capacity ?? 0).toString(16)}`,
    lock: mapScript(o.lock),
    type_: mapScript(o.type ?? undefined),
  })

  const mapRawTx = (raw: AnnotatedRawTransaction | TransactionLike): Record<string, unknown> => ({
    version: Number(numFrom(raw.version ?? 0)),
    cell_deps: (raw.cellDeps ?? []).map(mapCellDep),
    header_deps: raw.headerDeps ?? [],
    inputs: (raw.inputs ?? []).map((i) => {
      if ("input" in i) {
        return {
          input: mapInput(i.input),
          source: mapRawTx(i.source as TransactionLike),
        }
      }
      return mapInput(i as CellInputLike)
    }),
    outputs: (raw.outputs ?? []).map(mapOutput),
    outputs_data: raw.outputsData ?? [],
  })

  return {
    signPath: tx.signPath.map((p) => Number(numFrom(p))),
    changePath: tx.changePath.map((p) => Number(numFrom(p))),
    inputCount: Number(numFrom(tx.inputCount)),
    raw: mapRawTx(tx.raw),
    witnesses: tx.witnesses,
  }
}

describe("Transaction Schema Comparison", () => {
  it("should match legacy and new serialization using ledger.ts builder", () => {
    const tx = buildAnnotatedTransaction(signPath, transaction, witnesses, contexts, changePath)

    const legacyTx = toLegacyAnnotatedTransaction(tx)
    const legacyBytes = Buffer.from(SerializeAnnotatedTransaction(legacyTx as any))
    const newBytes = Buffer.from(AnnotatedTransactionCodec.encode(tx))

    if (hexFrom(newBytes) !== hexFrom(legacyBytes)) {
      let firstDiff = -1
      for (let i = 0; i < Math.max(newBytes.length, legacyBytes.length); i++) {
        if (newBytes[i] !== legacyBytes[i]) {
          firstDiff = i
          break
        }
      }
      console.log(`Mismatch at index ${firstDiff}`)
      console.log(`Legacy segment at ${firstDiff}:`, hexFrom(legacyBytes.slice(firstDiff, firstDiff + 10)))
      console.log(`New segment at ${firstDiff}:   `, hexFrom(newBytes.slice(firstDiff, firstDiff + 10)))
    }

    expect(hexFrom(newBytes)).toBe(hexFrom(legacyBytes))
  })
})
