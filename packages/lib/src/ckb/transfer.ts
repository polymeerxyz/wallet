import type { Client } from "@ckb-ccc/core"
import { Address, CellOutput, fixedPointFrom, Script, stringify, Transaction } from "@ckb-ccc/core"

import { WorkerSigner } from "./signer"

export async function buildSendCkbTransaction(
  client: Client,
  scriptInfo: { script: Script; path: string }[],
  toAddress: string,
  amount: string | "max",
  feeRate: bigint = 100000n
) {
  const receiverAddress = await Address.fromString(toAddress, client)
  const scripts = scriptInfo.map((si) => Script.from(si.script))

  const signer = new WorkerSigner(client, Address.fromScript(scripts[0], client), scripts)

  const tx = Transaction.from({
    inputs: [],
    outputs: [
      CellOutput.from({
        capacity: amount === "max" ? 0n : fixedPointFrom(amount, 8),
        lock: receiverAddress.script,
      }),
    ],
    outputsData: ["0x"],
  })

  if (amount === "max") {
    await tx.completeInputsAll(signer)
    await tx.completeFeeChangeToOutput(signer, 0, feeRate)
  } else {
    await tx.completeInputsByCapacity(signer)
    await tx.completeFeeBy(signer, feeRate)
  }

  return tx
}

export async function prepareResult(client: Client, tx: Transaction, lockToPath: Map<string, string>) {
  const contextResults = await Promise.all(
    tx.inputs.map(async (input, i) => {
      const fullTx = await client.getTransaction(input.previousOutput.txHash)
      if (!fullTx) {
        throw new Error(
          `Could not fetch context transaction for input: ${input.previousOutput.txHash}. The Ledger device requires full context transactions for every input.`
        )
      }

      const inputCell = fullTx.transaction.outputs[Number(input.previousOutput.index)]
      const lockHash = inputCell.lock.hash()
      const path = lockToPath.get(lockHash) || "m/44'/309'/0'"
      return {
        context: fullTx.transaction,
        path,
        lockHash,
        index: i,
      }
    })
  )

  const signPaths = contextResults.map((r) => r.path)

  const signerInput = contextResults.find((r) => lockToPath.has(r.lockHash))
  const targetWitnessIndex = signerInput?.index ?? 0

  return {
    tx: JSON.parse(stringify(tx)),
    signPaths,
    targetWitnessIndex,
    fee: (await tx.getFee(client)).toString(),
    contexts: contextResults.map((r) => JSON.parse(stringify(r.context))),
    witnesses: tx.witnesses,
  }
}
