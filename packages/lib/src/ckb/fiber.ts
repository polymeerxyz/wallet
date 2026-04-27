import type { Client } from "@ckb-ccc/core"
import { Script, stringify, Transaction } from "@ckb-ccc/core"
import type { CkbJsonRpcTransaction } from "@nervosnetwork/fiber-js"

export async function buildFiberFunding(
  client: Client,
  rpcTx: CkbJsonRpcTransaction,
  scripts: { script: Script; path: string }[]
) {
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

  const lockToPath = new Map(scripts.map((s) => [Script.from(s.script).hash(), s.path]))
  const userLockHashes = new Set(lockToPath.keys())

  const inputDetails = await Promise.all(
    tx.inputs.map(async (input) => {
      const fullTx = await client.getTransaction(input.previousOutput.txHash)
      if (!fullTx) {
        throw new Error(
          `Could not fetch context transaction for input: ${input.previousOutput.txHash}. ` +
            "The Ledger device requires full context transactions for every input."
        )
      }

      // Hardware wallets like Ledger do not use witnesses of the context transactions for hash verification.
      // So we can strip them to avoid hitting hardware wallet memory limits when sending AnnotatedTransactions.
      const contextTxRaw = JSON.parse(stringify(fullTx.transaction))
      contextTxRaw.witnesses = []
      const contextTx = Transaction.from(contextTxRaw)

      const idx = Number(input.previousOutput.index)
      const cellOutput = fullTx.transaction.outputs[idx]
      input.cellOutput = cellOutput
      input.outputData = fullTx.transaction.outputsData[idx] ?? "0x"
      return { context: contextTx, lockHash: cellOutput.lock.hash() }
    })
  )

  let signPath = "m/44'/309'/0'"
  let targetWitnessIndex = 0

  for (let i = 0; i < tx.inputs.length; i++) {
    if (userLockHashes.has(inputDetails[i].lockHash)) {
      signPath = lockToPath.get(inputDetails[i].lockHash) ?? "m/44'/309'/0'"
      targetWitnessIndex = i
      break
    }
  }

  const fee = (await tx.getFee(client)).toString()

  // When sending to hardware wallet, replace the node's dummy witness with "0x"
  // because hardware wallets (especially Ledger) can choke on unexpectedly large witnesses during parsing.
  const modifiedWitnesses = [...tx.witnesses]
  for (let i = 0; i < tx.inputs.length; i++) {
    if (i !== targetWitnessIndex) {
      modifiedWitnesses[i] = "0x"
    }
  }

  return {
    tx: JSON.parse(stringify(tx)),
    signPaths: [signPath],
    targetWitnessIndex,
    fee,
    contexts: inputDetails.map((d) => JSON.parse(stringify(d.context))),
    witnesses: modifiedWitnesses,
    originalWitnesses: tx.witnesses,
  }
}
