import type {
  CellDepLike,
  CellInputLike,
  CellOutputLike,
  HashTypeLike,
  Hex,
  NumLike,
  OutPointLike,
  ScriptLike,
  SinceLike,
  TransactionLike,
} from "@ckb-ccc/core"
import { bytesFrom, DepTypeCodec, depTypeFrom, HashTypeCodec, mol, numFrom, Since } from "@ckb-ccc/core"

/**
 * Helper to ensure a NumLike is correctly parsed even if it's a hex string without 0x.
 */
function safeNum(val: NumLike): bigint {
  if (typeof val === "string" && !val.startsWith("0x") && /^[0-9a-fA-F]+$/.test(val)) {
    return BigInt(`0x${val}`)
  }
  return numFrom(val)
}

const Uint32 = mol.Uint32.map({
  inMap: safeNum,
  outMap: (val) => val,
})
const Uint64 = mol.Uint64.map({
  inMap: safeNum,
  outMap: (val) => val,
})
const SinceCodec = mol.Uint64.map({
  inMap: (val: SinceLike | NumLike) => {
    if (typeof val === "object" && val !== null && "value" in val) {
      return Since.from(val as SinceLike).toNum()
    }
    return numFrom(val ?? 0)
  },
  outMap: (val) => val,
})

const DepTypeCodecSafe = DepTypeCodec.map({
  inMap: depTypeFrom,
  outMap: (val) => val,
})

const HashTypeCodecSafe = HashTypeCodec.map({
  inMap: (val: HashTypeLike) => val,
  outMap: (val) => val,
})

/**
 * Standard CKB types mapped from @ckb-ccc/core (camelCase).
 */

export const OutPoint = mol
  .struct({
    tx_hash: mol.Byte32,
    index: Uint32,
  })
  .map({
    inMap: (val: OutPointLike) => ({
      tx_hash: val.txHash,
      index: val.index,
    }),
    outMap: (val) => ({
      txHash: val.tx_hash,
      index: val.index,
    }),
  })

export const Script = mol
  .table({
    code_hash: mol.Byte32,
    hash_type: HashTypeCodecSafe,
    args: mol.Bytes,
  })
  .map({
    inMap: (val: ScriptLike) => ({
      code_hash: val.codeHash,
      hash_type: val.hashType,
      args: val.args,
    }),
    outMap: (val) => ({
      codeHash: val.code_hash,
      hashType: val.hash_type,
      args: val.args,
    }),
  })

export const ScriptOpt = mol.option(Script)

export const CellInput = mol
  .struct({
    since: SinceCodec,
    previous_output: OutPoint,
  })
  .map({
    inMap: (val: CellInputLike) => ({
      since: val.since ?? 0,
      previous_output: "previousOutput" in val ? val.previousOutput : val.outPoint,
    }),
    outMap: (val) => ({
      since: val.since,
      previousOutput: val.previous_output,
    }),
  })

export const CellDep = mol
  .struct({
    out_point: OutPoint,
    dep_type: DepTypeCodecSafe,
  })
  .map({
    inMap: (val: CellDepLike) => ({
      out_point: val.outPoint,
      dep_type: val.depType,
    }),
    outMap: (val) => ({
      outPoint: val.out_point,
      depType: val.dep_type,
    }),
  })

export const CellDepVec = mol.vector(CellDep)

export const CellOutput = mol
  .table({
    capacity: Uint64,
    lock: Script,
    type: ScriptOpt,
  })
  .map({
    inMap: (val: CellOutputLike) => ({
      capacity: val.capacity ?? 0,
      lock: val.lock,
      type: val.type ?? undefined,
    }),
    outMap: (val) => ({
      capacity: val.capacity,
      lock: val.lock,
      type: val.type,
    }),
  })

export const CellOutputVec = mol.vector(CellOutput)

export const RawTransaction = mol
  .table({
    version: Uint32,
    cell_deps: CellDepVec,
    header_deps: mol.Byte32Vec,
    inputs: mol.vector(CellInput),
    outputs: CellOutputVec,
    outputs_data: mol.BytesVec,
  })
  .map({
    inMap: (val: TransactionLike) => {
      if (!val) throw new Error("Transaction is null or undefined")
      return {
        version: val.version ?? 0,
        cell_deps: val.cellDeps ?? [],
        header_deps: val.headerDeps ?? [],
        inputs: val.inputs ?? [],
        outputs: val.outputs ?? [],
        outputs_data: val.outputsData ?? [],
      }
    },
    outMap: (val) => ({
      version: val.version,
      cellDeps: val.cell_deps,
      headerDeps: val.header_deps,
      inputs: val.inputs,
      outputs: val.outputs,
      outputsData: val.outputs_data,
    }),
  })

/**
 * A codec that accepts either a Transaction object or its pre-encoded bytes.
 */
export const RawTransactionOrBytes = mol.Codec.from<TransactionLike | Hex | Uint8Array, TransactionLike>({
  encode: (val) => {
    if (!val) throw new Error("RawTransactionOrBytes: value is null or undefined")
    return val instanceof Uint8Array ||
      (typeof Buffer !== "undefined" && Buffer.isBuffer(val)) ||
      (typeof val === "string" && val.startsWith("0x"))
      ? bytesFrom(val as Hex | Uint8Array)
      : RawTransaction.encode(val as TransactionLike)
  },
  decode: RawTransaction.decode,
})

/**
 * Bip32 path is a vector of 32-bit unsigned integers.
 */
export const Bip32 = mol.vector(mol.Uint32)

/**
 * AnnotatedCellInput includes a cell input and its original transaction.
 */
export const AnnotatedCellInput = mol
  .table({
    input: CellInput,
    source: RawTransactionOrBytes,
  })
  .map({
    inMap: (val: { input: CellInputLike; source: TransactionLike | Hex | Uint8Array }) => {
      if (!val || !val.input || !val.source) {
        throw new Error("AnnotatedCellInput: missing input or source")
      }
      return {
        input: val.input,
        source: val.source,
      }
    },
    outMap: (val) => ({
      input: val.input,
      source: val.source,
    }),
  })

export const AnnotatedCellInputVec = mol.vector(AnnotatedCellInput)

/**
 * AnnotatedRawTransaction is similar to RawTransaction but with annotated inputs.
 */
export const AnnotatedRawTransaction = mol
  .table({
    version: Uint32,
    cell_deps: CellDepVec,
    header_deps: mol.Byte32Vec,
    inputs: AnnotatedCellInputVec,
    outputs: CellOutputVec,
    outputs_data: mol.BytesVec,
  })
  .map({
    inMap: (val: {
      version: NumLike
      cellDeps: CellDepLike[]
      headerDeps: Hex[]
      inputs: { input: CellInputLike; source: TransactionLike | Hex | Uint8Array }[]
      outputs: CellOutputLike[]
      outputsData: Hex[]
    }) => {
      if (!val) throw new Error("AnnotatedRawTransaction: value is null or undefined")
      return {
        version: val.version ?? 0,
        cell_deps: val.cellDeps ?? [],
        header_deps: val.headerDeps ?? [],
        inputs: val.inputs ?? [],
        outputs: val.outputs ?? [],
        outputs_data: val.outputsData ?? [],
      }
    },
    outMap: (val) => ({
      version: val.version,
      cellDeps: val.cell_deps,
      headerDeps: val.header_deps,
      inputs: val.inputs,
      outputs: val.outputs,
      outputsData: val.outputs_data,
    }),
  })

/**
 * AnnotatedTransaction represents the full structure sent to the Ledger for signing.
 */
export const AnnotatedTransaction = mol
  .table({
    sign_path: Bip32,
    change_path: Bip32,
    input_count: Uint32,
    raw: AnnotatedRawTransaction,
    witnesses: mol.BytesVec,
  })
  .map({
    inMap: (val: {
      signPath: NumLike[]
      changePath: NumLike[]
      inputCount: NumLike
      raw: {
        version: NumLike
        cellDeps: CellDepLike[]
        headerDeps: Hex[]
        inputs: { input: CellInputLike; source: TransactionLike | Hex | Uint8Array }[]
        outputs: CellOutputLike[]
        outputsData: Hex[]
      }
      witnesses: Hex[]
    }) => ({
      sign_path: val.signPath,
      change_path: val.changePath,
      input_count: val.inputCount,
      raw: val.raw,
      witnesses: val.witnesses,
    }),
    outMap: (val) => ({
      signPath: val.sign_path,
      changePath: val.change_path,
      inputCount: val.input_count,
      raw: val.raw,
      witnesses: val.witnesses,
    }),
  })

export type AnnotatedTransaction = mol.DecodedType<typeof AnnotatedTransaction>
export type AnnotatedRawTransaction = mol.DecodedType<typeof AnnotatedRawTransaction>
export type AnnotatedCellInput = mol.DecodedType<typeof AnnotatedCellInput>
