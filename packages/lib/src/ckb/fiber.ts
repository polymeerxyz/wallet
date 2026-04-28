import type { Client } from "@ckb-ccc/core"
import { bytesFrom, hashCkb, hexFrom, stringify, Transaction, WitnessArgs } from "@ckb-ccc/core"
import type { CkbJsonRpcTransaction } from "@nervosnetwork/fiber-js"

export async function buildFiberFunding(client: Client, rpcTx: CkbJsonRpcTransaction, lockToPath: Map<string, string>) {
  const tx = Transaction.from({
    version: rpcTx.version,
    cellDeps: rpcTx.cell_deps.map((dep) => ({
      outPoint: { txHash: dep.out_point.tx_hash, index: dep.out_point.index },
      depType: dep.dep_type === "dep_group" ? "depGroup" : "code",
    })),
    headerDeps: rpcTx.header_deps,
    inputs: rpcTx.inputs.map((input) => ({
      previousOutput: { txHash: input.previous_output.tx_hash, index: input.previous_output.index },
      since: input.since,
    })),
    outputs: rpcTx.outputs.map((output) => ({
      capacity: output.capacity,
      lock: { codeHash: output.lock.code_hash, hashType: output.lock.hash_type, args: output.lock.args ?? "0x" },
      type: output.type
        ? { codeHash: output.type.code_hash, hashType: output.type.hash_type, args: output.type.args ?? "0x" }
        : undefined,
    })),
    outputsData: rpcTx.outputs_data,
    witnesses: rpcTx.witnesses,
  })

  const inputResults = await Promise.all(
    tx.inputs.map(async (input, i) => {
      const cell = await client.getCell(input.previousOutput)
      const lockHash = cell?.cellOutput.lock.hash() ?? null
      const path = (lockHash && lockToPath.get(lockHash)) || "m/44'/309'/0'"
      return { path, lockHash, index: i }
    })
  )

  const signPaths = inputResults.map((r) => r.path)

  const signerInput = inputResults.find((r) => r.lockHash !== null && lockToPath.has(r.lockHash))
  const targetWitnessIndex = signerInput?.index ?? 0

  const fee = (await tx.getFee(client)).toString()

  return {
    tx: JSON.parse(stringify(tx)),
    signPaths,
    targetWitnessIndex,
    fee,
    contexts: [],
    witnesses: tx.witnesses,
    sighash: computeCkbSighash(tx),
  }
}

/**
 * Compute the CKB sighash for a single-group secp256k1 signing operation.
 *
 * The Ledger CKB app's AnnotatedTransaction signing (INS 0x03) rejects
 * "multi-input multi-output" transactions (2+ distinct input sources AND
 * 2+ non-change outputs). Fiber funding TXs always hit this case because:
 *   - Inputs may come from different user addresses
 *   - FundingLock output (unknown code hash) + additional change outputs
 *     each count as separate "destinations"
 *
 * Instead, we compute the sighash here and use INS_SIGN_MESSAGE_HASH (0x07)
 * to sign it directly. The device shows "Sign: Message Hash | <hex>" to the user.
 *
 * CKB sighash for a lock group = blake2b(
 *   txHash                              // raw TX hash (no witnesses)
 *   u64le(witnessArgsLen)               // 8-byte length prefix
 *   WitnessArgs(lock=65_zero_bytes)     // zeroed placeholder (standard RFC-0020)
 * )
 */
function computeCkbSighash(tx: Transaction): string {
  // Raw TX hash (no witnesses)
  const txHash = bytesFrom(tx.hash())

  // Reconstruct the WitnessArgs with the lock field zeroed for signing
  // (RFC-0020: the placeholder in the witness is always 65 zero bytes for secp256k1)
  const witnessArgs = WitnessArgs.from({ lock: `0x${"00".repeat(65)}` })
  const witnessBytes = witnessArgs.toBytes()

  // CKB protocol prefixes each group witness with its byte length as u64 LE
  const lenBuf = new ArrayBuffer(8)
  new DataView(lenBuf).setBigUint64(0, BigInt(witnessBytes.length), true)

  // sighash = blake2b("ckb-default-hash", txHash || u64le(len) || witnessBytes)
  const message = new Uint8Array(txHash.length + 8 + witnessBytes.length)
  message.set(txHash, 0)
  message.set(new Uint8Array(lenBuf), txHash.length)
  message.set(witnessBytes, txHash.length + 8)

  return hexFrom(hashCkb(message))
}
