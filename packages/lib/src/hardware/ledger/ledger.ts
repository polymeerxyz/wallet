import type { TransactionLike } from "@ckb-ccc/core"
import {
  Address,
  bytesFrom,
  CellInput,
  depTypeFrom,
  hashCkb,
  hexFrom,
  KnownScript,
  numFrom,
  Script,
  Since,
  stringify,
} from "@ckb-ccc/core"
import { MAINNET_SCRIPTS, TESTNET_SCRIPTS } from "@ckb-ccc/core/advanced"
import type Transport from "@ledgerhq/hw-transport"

import { prepBipPath } from "../../utils"
import type {
  AnnotatedRawTransaction,
  AnnotatedTransaction,
  AppConfiguration,
  ExtendPublicKey,
  WalletPublicKey,
} from "./model"
import { AnnotatedTransaction as SerializeAnnotatedTransaction } from "./schema"

/**
 * An empty WitnessArgs with enough space to fit a sighash signature into.
 */
const defaultSighashWitness =
  "0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" as const

/**
 * Construct an AnnotatedTransaction for a given collection of signing data
 *
 * Parameters are the same as for signTransaction, but no ledger interaction is attempted.
 *
 * AnnotatedTransaction is a type defined for the ledger app that collects
 * all of the information needed to securely confirm a transaction on-screen
 * and a few bits of duplicative information to allow it to be processed as a
 * stream.
 */
export function buildAnnotatedTransaction(
  signPath: string,
  tx: TransactionLike,
  groupWitnesses: string[],
  contexts: TransactionLike[],
  changePath: string
): AnnotatedTransaction {
  const signBipPath = prepBipPath(signPath)
  const changeBipPath = prepBipPath(changePath)

  const { inputs, cellDeps, headerDeps, outputs, outputsData, version } = tx

  if (!inputs || inputs.length !== contexts.length) {
    throw new Error(
      `Transaction input count (${inputs?.length ?? 0}) does not match context transaction count (${
        contexts.length
      }). ` + "Each input must have a corresponding context transaction for Ledger to verify the source funds."
    )
  }

  const annotatedInputs = inputs.map((input, idx) => {
    const source = contexts[idx]
    if (!source) {
      throw new Error(`Context transaction at index ${idx} is missing.`)
    }
    return {
      input,
      source,
    }
  })

  const rawTransaction: AnnotatedRawTransaction = {
    version: Number(numFrom(version ?? 0)),
    cellDeps: (cellDeps ?? []).map((cd) => ({
      outPoint: {
        txHash: hexFrom(cd.outPoint.txHash),
        index: Number(numFrom(cd.outPoint.index)),
      },
      depType: depTypeFrom(cd.depType),
    })),
    headerDeps: (headerDeps ?? []).map((hd) => hexFrom(hd)),
    inputs: annotatedInputs.map((i) => {
      const since =
        typeof i.input.since === "object" && i.input.since !== null && "value" in i.input.since
          ? Since.from(i.input.since).toNum()
          : numFrom(i.input.since ?? 0)
      const input = CellInput.from(i.input)
      return {
        input: {
          since,
          previousOutput: {
            txHash: hexFrom(input.previousOutput.txHash),
            index: Number(numFrom(input.previousOutput.index)),
          },
        },
        source: i.source,
      }
    }),
    outputs: (outputs ?? []).map((o) => ({
      capacity: numFrom(o.capacity ?? 0n),
      lock: Script.from(o.lock),
      type: o.type ? Script.from(o.type) : undefined,
    })),
    outputsData: (outputsData ?? []).map((d) => hexFrom(d)),
  }

  const annotatedTransaction: AnnotatedTransaction = {
    signPath: signBipPath,
    changePath: changeBipPath,
    inputCount: inputs.length,
    raw: rawTransaction,
    witnesses: (Array.isArray(groupWitnesses) && groupWitnesses.length > 0
      ? groupWitnesses
      : [defaultSighashWitness]
    ).map((w) => hexFrom(w)),
  }

  return annotatedTransaction
}

/**
 * Nervos API
 *
 * @example
 * import { LedgerCKB } from "@polymeerxyz/hardware";
 * const ledgerCKB = new LedgerCKB(transport);
 */
export default class LedgerCKB {
  private transport: Transport

  constructor(transport: Transport, scrambleKey: string = "CKB") {
    this.transport = transport

    transport.decorateAppAPIMethods(
      this,
      [
        "getAppConfiguration",
        "getWalletId",
        "getWalletPublicKey",
        "getWalletExtendedPublicKey",
        "signAnnotatedTransaction",
      ],
      scrambleKey
    )
  }

  private async sendAPDU(ins: number, p1: number, p2: number, data?: Buffer): Promise<Buffer> {
    const cla = 0x80
    console.debug(
      `Ledger [send] CLA=${cla.toString(16)} INS=${ins.toString(16)} P1=${p1.toString(16)} P2=${p2.toString(16)} data:`,
      data
    )
    return await this.transport.send(cla, ins, p1, p2, data)
  }

  /**
   * Get CKB address for a given BIP 32 path.
   *
   * @param path a path in BIP 32 format
   * @param script secp256k1+blake160 lock script
   * @param testnet whether to use testnet addresses
   * @return an object with a publicKey, lockArg, and (secp256k1+blake160) address.
   * @example
   * const result = await ckb.getWalletPublicKey("44'/144'/0'/0/0", {codeHash: "0x...", hashType: "type"});
   * const publicKey = result.publicKey;
   * const lockArg = result.lockArg;
   * const address = result.address;
   */
  async getWalletPublicKey(path: string, testnet: boolean = false): Promise<WalletPublicKey> {
    const bipPath = prepBipPath(path)

    const data = Buffer.alloc(1 + bipPath.length * 4)

    data.writeUInt8(bipPath.length, 0)
    bipPath.forEach((segment, index) => {
      data.writeUInt32BE(segment, 1 + index * 4)
    })

    const response = await this.sendAPDU(0x02, 0x00, 0x00, Buffer.from(data))

    const publicKeyLength = response[0]
    const publicKey = response.subarray(1, 1 + publicKeyLength)

    const compressedPublicKey = Buffer.alloc(33)
    compressedPublicKey.fill(publicKey[64] & 1 ? "03" : "02", 0, 1, "hex")
    compressedPublicKey.fill(publicKey.subarray(1, 33), 1, 33)

    const publicKeyHex = `0x${compressedPublicKey.toString("hex")}` as const
    const lockArg = hexFrom(bytesFrom(hashCkb(publicKeyHex)).slice(0, 20))

    const script = testnet
      ? TESTNET_SCRIPTS[KnownScript.Secp256k1Blake160]
      : MAINNET_SCRIPTS[KnownScript.Secp256k1Blake160]
    const address = new Address(
      Script.from({
        codeHash: script!.codeHash,
        hashType: script!.hashType,
        args: lockArg,
      }),
      testnet ? "ckt" : "ckb"
    ).toString()

    return {
      publicKey: publicKeyHex,
      lockArg: lockArg,
      address: address,
    }
  }

  /**
   * Get extended public key for a given BIP 32 path.
   *
   * @param path a path in BIP 32 format
   * @return an object with a publicKey
   * @example
   * const result = await ckb.getWalletExtendedPublicKey("44'/144'/0'/0/0");
   * const publicKey = result;
   */
  async getWalletExtendedPublicKey(path: string): Promise<ExtendPublicKey> {
    const bipPath = prepBipPath(path)

    const data = Buffer.alloc(1 + bipPath.length * 4)

    data.writeUInt8(bipPath.length, 0)
    bipPath.forEach((segment, index) => {
      data.writeUInt32BE(segment, 1 + index * 4)
    })

    const response = await this.sendAPDU(0x04, 0x00, 0x00, Buffer.from(data))
    const publicKeyLength = response[0]
    const chainCodeOffset = 2 + publicKeyLength
    const chainCodeLength = response[1 + publicKeyLength]

    return {
      publicKey: response.subarray(1, 1 + publicKeyLength).toString("hex"),
      chainCode: response.subarray(chainCodeOffset, chainCodeOffset + chainCodeLength).toString("hex"),
    }
  }

  /**
   * Sign a Nervos transaction with a given BIP 32 path
   *
   * @param signPath the path to sign with, in BIP 32 format
   * @param tx a transaction object to sign
   * @param groupWitnesses hex of in-group and extra witnesses to include in signature
   * @param contexts list of full transaction contexts for parsing
   * @param changePath the path the transaction sends change to, in BIP 32 format (optional, defaults to signPath)
   * @return a signature as hex string
   */
  async signTransaction(
    signPath: string,
    tx: TransactionLike,
    groupWitnesses: string[],
    contexts: TransactionLike[],
    changePath: string
  ): Promise<string> {
    console.debug(
      "[Ledger] signTransaction payload:",
      stringify({ signPath, tx, groupWitnesses, contextCount: contexts.length, contexts, changePath })
    )

    const annotatedTx = buildAnnotatedTransaction(signPath, tx, groupWitnesses, contexts, changePath)
    console.debug("[Ledger] buildAnnotatedTransaction completed")
    return await this.signAnnotatedTransaction(annotatedTx)
  }

  /**
   * Sign an already constructed AnnotatedTransaction.
   */
  async signAnnotatedTransaction(tx: AnnotatedTransaction): Promise<string> {
    console.debug("[Ledger] signAnnotatedTransaction encoding...")
    let rawAnTx: Buffer
    try {
      rawAnTx = Buffer.from(SerializeAnnotatedTransaction.encode(tx))
    } catch (e) {
      console.error("[Ledger] signAnnotatedTransaction Molecule encoding failed:", e)
      throw e
    }
    console.debug(`[Ledger] signAnnotatedTransaction encoded: ${rawAnTx.byteLength} bytes`)

    const maxApduSize = 230

    const txFullChunks = Math.floor(rawAnTx.byteLength / maxApduSize)
    const totalChunks = txFullChunks + 1
    let isContinuation = 0x00
    for (let i = 0; i < txFullChunks; i++) {
      const data = rawAnTx.subarray(i * maxApduSize, (i + 1) * maxApduSize)
      console.debug(`[Ledger] Sending chunk ${i + 1}/${totalChunks}...`)
      await this.sendAPDU(0x03, isContinuation, 0x00, Buffer.from(data))
      isContinuation = 0x01
    }

    const lastOffset = txFullChunks * maxApduSize
    const lastData = rawAnTx.subarray(lastOffset, lastOffset + maxApduSize)
    console.debug(`[Ledger] Sending chunk ${totalChunks}/${totalChunks}...`)
    const response = await this.sendAPDU(0x03, isContinuation | 0x80, 0x00, Buffer.from(lastData))
    return response.subarray(0, 65).toString("hex")
  }

  /**
   * Get the version of the Nervos app installed on the hardware device
   *
   * @return an object with a version
   * @example
   * const result = await ckb.getAppConfiguration();
   *
   * {
   *   "version": "1.0.3",
   *   "hash": "0000000000000000000000000000000000000000"
   * }
   */
  async getAppConfiguration(): Promise<AppConfiguration> {
    const response1 = await this.sendAPDU(0x00, 0x00, 0x00)
    const response2 = await this.sendAPDU(0x09, 0x00, 0x00)
    return {
      version: "" + response1[0] + "." + response1[1] + "." + response1[2],
      hash: response2.subarray(0, -3).toString("hex"), // last 3 bytes should be 0x009000
    }
  }

  /**
   * Get the wallet identifier for the Ledger wallet
   *
   * @return a byte string
   * @example
   * const id = await ckb.getWalletId();
   *
   * "0x69c46b6dd072a2693378ef4f5f35dcd82f826dc1fdcc891255db5870f54b06e6"
   */
  async getWalletId(): Promise<string> {
    const response = await this.sendAPDU(0x01, 0x00, 0x00)

    const result = response.subarray(0, 32).toString("hex")
    return result
  }

  /**
   * Sign a Nervos message with a given BIP 32 path
   *
   * @param path a path in BIP 32 format
   * @param rawMsgHex a message to sign
   * @param displayHex display hex
   * @return a signature as hex string
   */
  async signMessage(path: string, rawMsgHex: string, displayHex: boolean): Promise<string> {
    const bipPath = prepBipPath(path)
    const magicBytes = Buffer.from("Nervos Message:")
    const rawMsg = Buffer.concat([magicBytes, Buffer.from(rawMsgHex, "hex")])

    //Init apdu
    const rawPath = Buffer.alloc(1 + 1 + bipPath.length * 4)
    rawPath.writeInt8(displayHex ? 1 : 0, 0)
    rawPath.writeInt8(bipPath.length, 1)
    bipPath.forEach((segment, index) => {
      rawPath.writeUInt32BE(segment, 2 + index * 4)
    })
    await this.sendAPDU(0x06, 0x00, 0x00, rawPath)

    // Msg Chunking
    const maxApduSize = 230
    const txFullChunks = Math.floor(rawMsg.length / maxApduSize)
    for (let i = 0; i < txFullChunks; i++) {
      const data = rawMsg.subarray(i * maxApduSize, (i + 1) * maxApduSize)
      await this.sendAPDU(0x06, 0x01, 0x00, Buffer.from(data))
    }

    const lastOffset = Math.floor(rawMsg.length / maxApduSize) * maxApduSize
    const lastData = rawMsg.subarray(lastOffset, lastOffset + maxApduSize)
    const response = await this.sendAPDU(0x06, 0x81, 0x00, Buffer.from(lastData))
    return response.subarray(0, 65).toString("hex")
  }
}
