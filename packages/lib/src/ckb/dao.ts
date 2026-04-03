import type { Cell, Client, ClientBlockHeader, Epoch } from "@ckb-ccc/core"
import {
  Address,
  calcDaoClaimEpoch,
  calcDaoProfit,
  CellOutput,
  fixedPointFrom,
  KnownScript,
  numFrom,
  numLeToBytes,
  Script,
  Transaction,
  WitnessArgs,
} from "@ckb-ccc/core"

import { WorkerSigner } from "./signer"

export function epochToNum(epoch: Epoch): bigint {
  return (numFrom(epoch[2]) << 40n) | (numFrom(epoch[1]) << 24n) | numFrom(epoch[0])
}

export function parseEpoch(epoch: Epoch): bigint {
  return fixedPointFrom(epoch[0]) + (fixedPointFrom(epoch[1]) * fixedPointFrom(1)) / fixedPointFrom(epoch[2])
}

export function getProfit(dao: Cell, depositHeader: ClientBlockHeader, withdrawHeader: ClientBlockHeader): bigint {
  const occupiedSize = numFrom(dao.cellOutput.occupiedSize) + numFrom(dao.outputData.length / 2 - 1)
  const profitableSize = numFrom(dao.cellOutput.capacity) - occupiedSize

  return calcDaoProfit(profitableSize, depositHeader, withdrawHeader)
}

export async function getDaoAPY(client: Client): Promise<string> {
  const tip = await client.getTipHeader()
  const tipNumber = tip.number
  const prevNumber = tipNumber > numFrom(1000) ? tipNumber - numFrom(1000) : numFrom(0)
  const prevHeader = await client.getHeaderByNumber(prevNumber)

  if (!prevHeader) return "0.00"

  const arDiff = tip.dao.ar - prevHeader.dao.ar
  const blockDiff = tip.number - prevHeader.number
  // Very rough estimation: APY = (diff / prev) * (blocks_per_year / blocks_diff)
  const apy =
    (Number(arDiff) / Number(prevHeader.dao.ar)) * (Number(numFrom((365 * 24 * 60 * 60) / 8)) / Number(blockDiff))

  return (apy * 100).toFixed(2)
}

export async function getDaoCellInfo(client: Client, dao: Cell) {
  const isDeposit = dao.outputData === "0x0000000000000000"
  const previousTxRes = await client.getTransactionWithHeader(dao.outPoint.txHash)
  if (!previousTxRes || !previousTxRes.header) {
    return null
  }
  const { transaction: previousTx, header: currentHeader } = previousTxRes
  const tipHeader = await client.getTipHeader()

  if (isDeposit) {
    return {
      type: "deposit",
      profit: getProfit(dao, currentHeader, tipHeader),
      depositHeader: currentHeader,
      tipHeader,
      targetEpoch: calcDaoClaimEpoch(currentHeader, tipHeader),
    }
  } else {
    // It's a withdrawal cell, we need to find the original deposit block
    const depositTxHash = previousTx.transaction.inputs[Number(dao.outPoint.index)].previousOutput.txHash
    const depositTxRes = await client.getTransactionWithHeader(depositTxHash)
    if (!depositTxRes || !depositTxRes.header) {
      return null
    }
    const { header: depositHeader } = depositTxRes
    return {
      type: "withdraw",
      profit: getProfit(dao, depositHeader, currentHeader),
      depositHeader,
      withdrawHeader: currentHeader,
      tipHeader,
      targetEpoch: calcDaoClaimEpoch(depositHeader, currentHeader),
    }
  }
}

export async function buildDaoDeposit(
  client: Client,
  scriptInfo: { script: Script; path: string }[],
  amount: string,
  feeRate: bigint = 100000n
) {
  const scripts = scriptInfo.map((si) => Script.from(si.script))
  const signer = new WorkerSigner(client, Address.fromScript(scripts[0], client), scripts)
  const lock = (await signer.getRecommendedAddressObj()).script

  const tx = Transaction.from({
    outputs: [
      CellOutput.from({
        lock,
        type: await Script.fromKnownScript(client, KnownScript.NervosDao, "0x"),
      }),
    ],
    outputsData: ["0x0000000000000000"],
  })

  // Set capacity after type script is added but before inputs are completed
  tx.outputs[0].capacity = fixedPointFrom(amount, 8)

  await tx.addCellDepsOfKnownScripts(client, KnownScript.NervosDao)
  await tx.completeInputsByCapacity(signer)
  await tx.completeFeeBy(signer, feeRate)

  return tx
}

export async function buildDaoAction(
  client: Client,
  scriptInfo: { script: Script; path: string }[],
  dao: Cell,
  feeRate: bigint = 100000n
) {
  const scripts = scriptInfo.map((si) => Script.from(si.script))
  const signer = new WorkerSigner(client, Address.fromScript(scripts[0], client), scripts)
  const isDeposit = dao.outputData === "0x0000000000000000"

  const previousTxRes = await client.getTransactionWithHeader(dao.outPoint.txHash)
  if (!previousTxRes || !previousTxRes.header) {
    throw new Error("Could not fetch transaction info for DAO cell")
  }
  const { transaction: previousTx, header: currentHeader } = previousTxRes

  if (isDeposit) {
    // Deposit -> Withdrawal (Phase 1)
    const blockNumber = currentHeader.number
    const tx = Transaction.from({
      headerDeps: [currentHeader.hash],
      inputs: [{ previousOutput: dao.outPoint }],
      outputs: [dao.cellOutput],
      outputsData: [numLeToBytes(blockNumber, 8)],
    })

    await tx.addCellDepsOfKnownScripts(client, KnownScript.NervosDao)
    await tx.completeInputsByCapacity(signer)
    await tx.completeFeeBy(signer, feeRate)
    return tx
  } else {
    // Withdrawal -> Claim (Phase 2)
    const depositTxHash = previousTx.transaction.inputs[Number(dao.outPoint.index)].previousOutput.txHash
    const depositTxRes = await client.getTransactionWithHeader(depositTxHash)
    if (!depositTxRes || !depositTxRes.header) {
      throw new Error("Could not fetch deposit transaction info")
    }
    const { header: depositHeader } = depositTxRes

    const tx = Transaction.from({
      headerDeps: [currentHeader.hash, depositHeader.hash],
      inputs: [
        {
          previousOutput: dao.outPoint,
          since: {
            relative: "absolute",
            metric: "epoch",
            value: epochToNum(calcDaoClaimEpoch(depositHeader, currentHeader)),
          },
        },
      ],
      outputs: [
        {
          lock: (await signer.getRecommendedAddressObj()).script,
        },
      ],
      witnesses: [WitnessArgs.from({ inputType: numLeToBytes(1, 8) }).toBytes()],
    })

    await tx.addCellDepsOfKnownScripts(client, KnownScript.NervosDao)
    await tx.completeInputsByCapacity(signer)
    await tx.completeFeeChangeToOutput(signer, 0, feeRate)

    // Add profit
    const profit = getProfit(dao, depositHeader, currentHeader)
    tx.outputs[0].capacity = numFrom(tx.outputs[0].capacity) + profit

    return tx
  }
}
