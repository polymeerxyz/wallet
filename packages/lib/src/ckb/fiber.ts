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
    sighash: computeCkbSighash(
      tx,
      targetWitnessIndex,
      inputResults.map((r) => r.lockHash)
    ),
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
 * CKB sighash-all for a lock group (RFC-0020):
 *   blake2b(
 *     txHash                                    // raw TX hash (no witnesses)
 *     u64le(len) || witnesses[targetIdx]_zeroed // zeroed placeholder for the signing input
 *     u64le(len) || witnesses[i]...             // all other inputs in the same lock group
 *     u64le(len) || witnesses[j]...             // extra witnesses (index >= inputs.length)
 *   )
 *
 * @param inputLockHashes - lock hash for each tx input (null if cell could not be fetched)
 */
function computeCkbSighash(tx: Transaction, targetWitnessIndex: number, inputLockHashes: (string | null)[]): string {
  const txHash = bytesFrom(tx.hash())
  const targetLockHash = inputLockHashes[targetWitnessIndex]
  const inputCount = tx.inputs.length

  const parts: Uint8Array[] = [txHash]

  const pushLenPrefixed = (bytes: Uint8Array) => {
    const lenBuf = new ArrayBuffer(8)
    new DataView(lenBuf).setBigUint64(0, BigInt(bytes.length), true)
    parts.push(new Uint8Array(lenBuf))
    parts.push(bytes)
  }

  // Target witness: preserve any input_type/output_type fields but zero the lock field.
  const targetWitnessHex = tx.witnesses[targetWitnessIndex]
  const targetWitnessBytes = targetWitnessHex ? bytesFrom(targetWitnessHex) : new Uint8Array(0)
  let targetArgs: WitnessArgs
  if (targetWitnessBytes.length > 0) {
    targetArgs = WitnessArgs.fromBytes(targetWitnessBytes)
  } else {
    targetArgs = WitnessArgs.from({ lock: `0x${"00".repeat(65)}` })
  }
  targetArgs.lock = `0x${"00".repeat(65)}`
  pushLenPrefixed(targetArgs.toBytes())

  // Same-group witnesses: subsequent inputs sharing the same lock hash.
  // Each contributes u64le(len) || witness_bytes to the sighash.
  for (let i = targetWitnessIndex + 1; i < inputCount; i++) {
    if (inputLockHashes[i] !== null && inputLockHashes[i] === targetLockHash) {
      const w = tx.witnesses[i]
      pushLenPrefixed(w ? bytesFrom(w) : new Uint8Array(0))
    }
  }

  // Extra witnesses (index >= inputCount) are always included.
  for (let i = inputCount; i < tx.witnesses.length; i++) {
    const w = tx.witnesses[i]
    pushLenPrefixed(w ? bytesFrom(w) : new Uint8Array(0))
  }

  const totalLen = parts.reduce((sum, p) => sum + p.length, 0)
  const message = new Uint8Array(totalLen)
  let offset = 0
  for (const part of parts) {
    message.set(part, offset)
    offset += part.length
  }

  return hexFrom(hashCkb(message))
}
