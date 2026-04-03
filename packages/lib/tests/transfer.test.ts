import { ClientPublicTestnet, Transaction } from "@ckb-ccc/core"
import { parseUnit } from "@ckb-lumos/bi"
import { Indexer } from "@ckb-lumos/ckb-indexer"
import { common } from "@ckb-lumos/common-scripts"
import { predefined } from "@ckb-lumos/config-manager"
import { createTransactionFromSkeleton, TransactionSkeleton, transactionSkeletonToObject } from "@ckb-lumos/helpers"
import { CKBRPC } from "@ckb-lumos/rpc"
import { describe, expect, it } from "vitest"

import { getSingleAddress } from "../src/ckb/address"
import { buildSendCkbTransaction, prepareResult } from "../src/ckb/transfer"
import type { TxCell, TxSkeleton } from "./utils"
import { cccTxToSkeleton } from "./utils"

const client = new ClientPublicTestnet()
const rpc = new CKBRPC("https://mainnet.ckb.dev")
const indexer = new Indexer("https://testnet.ckb.dev")
const config = {
  config: predefined.AGGRON4,
}

describe("transfer", () => {
  it("lumos should match ccc transfer object", async () => {
    const from = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq03jn84lfudy2l4z268zu35535wdezqltcj4wpe4"
    const to = "ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq8ze7878mrj2snnqmev494jymzl4cnfk2y03mw2j"

    let txSkeleton = new TransactionSkeleton({ cellProvider: indexer })
    txSkeleton = await common.transfer(txSkeleton, [from], to, parseUnit("10", "ckb"), undefined, undefined, config)
    txSkeleton = await common.payFeeByFeeRate(txSkeleton, [from], 100000, undefined, config)

    const { address, scripts } = await getSingleAddress(
      client,
      "0x04cdd8755f0e5d9008f0398612e2c41196e541cbae2e36b27f00a84c425d10f6cbb2f2e1861b56d15058dd3f0cf081636d35b0864acc49abb61e9c708d2ee66058",
      "0xd7a42d1f61917ab53defb148d581d558968562dc2c512d6c0d663b580690a31d",
      true
    )

    expect(address).toEqual(from)

    const cccTx = await buildSendCkbTransaction(
      client,
      scripts.map((s) => ({ script: s.script, path: s.path })),
      to,
      "10",
      100000n
    )

    const convertedSkeleton = cccTxToSkeleton(cccTx)
    const expectedSkeleton = transactionSkeletonToObject(txSkeleton)

    const normalizeSkeleton = (s: TxSkeleton) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { cellProvider, ...rest } = s
      const normalizeCell = (c: TxCell) => ({
        ...c,
        cellOutput: {
          ...c.cellOutput,
          type: c.cellOutput.type ?? null,
        },
        blockNumber: undefined,
        blockHash: undefined,
      })
      return {
        ...rest,
        inputs: s.inputs.map(normalizeCell),
        outputs: s.outputs.map(normalizeCell),
      }
    }

    expect(normalizeSkeleton(convertedSkeleton)).toEqual(normalizeSkeleton(expectedSkeleton))
  })

  it("tx objects are equal", async () => {
    const from = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq03jn84lfudy2l4z268zu35535wdezqltcj4wpe4"
    const to = "ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqq8ze7878mrj2snnqmev494jymzl4cnfk2y03mw2j"

    let txSkeleton = new TransactionSkeleton({ cellProvider: indexer })
    txSkeleton = await common.transfer(txSkeleton, [from], to, parseUnit("10", "ckb"), undefined, undefined, config)
    txSkeleton = await common.payFeeByFeeRate(txSkeleton, [from], 100000, undefined, config)

    const lumosTx = createTransactionFromSkeleton(txSkeleton)
    const lumosRawTx = rpc.paramsFormatter.toRawTransaction(lumosTx)

    const lumosTxs = await Promise.all(lumosRawTx.inputs.map((i) => rpc.getTransaction(i.previous_output!.tx_hash)))
    const lumosContexts = lumosTxs.map((i) => rpc.paramsFormatter.toRawTransaction(i.transaction))
    const lumosWitnesses = lumosTx.witnesses

    const { scripts } = await getSingleAddress(
      client,
      "0x04cdd8755f0e5d9008f0398612e2c41196e541cbae2e36b27f00a84c425d10f6cbb2f2e1861b56d15058dd3f0cf081636d35b0864acc49abb61e9c708d2ee66058",
      "0xd7a42d1f61917ab53defb148d581d558968562dc2c512d6c0d663b580690a31d",
      true
    )

    const cccTx = await buildSendCkbTransaction(
      client,
      scripts.map((s) => ({ script: s.script, path: s.path })),
      to,
      "10",
      100000n
    )

    const lockToPath = new Map<string, string>()
    scripts.forEach((s) => lockToPath.set(s.script.hash(), s.path))
    const { tx: resultTx, witnesses: resultWitnesses } = await prepareResult(client, cccTx, lockToPath)

    const convertedSkeleton = cccTxToSkeleton(Transaction.from(resultTx))

    // Compare meaningful fields
    expect(convertedSkeleton.inputs.length).toBe(lumosRawTx.inputs.length)
    expect(convertedSkeleton.outputs.length).toBe(lumosRawTx.outputs.length)
    expect(resultWitnesses).toEqual(lumosWitnesses)
  })
})
