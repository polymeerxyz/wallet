import type { Address, CellDepInfo, Client, Script, TransactionLike } from "@ckb-ccc/core"
import { KnownScript, Signer, SignerSignType, SignerType, Transaction } from "@ckb-ccc/core"

export class WorkerSigner extends Signer {
  get type(): SignerType {
    return SignerType.CKB
  }

  get signType(): SignerSignType {
    return SignerSignType.CkbSecp256k1
  }

  constructor(
    client: Client,
    public address: Address,
    public allScripts: Script[]
  ) {
    super(client)
  }

  async connect(): Promise<void> {}

  async isConnected(): Promise<boolean> {
    return true
  }

  async getInternalAddress(): Promise<string> {
    return this.address.toString()
  }

  async getIdentity(): Promise<string> {
    return this.address.script.hash()
  }

  async getAddressObjs(): Promise<Address[]> {
    return [this.address]
  }

  async getRelatedScripts(txLike: TransactionLike): Promise<{ script: Script; cellDeps: CellDepInfo[] }[]> {
    const tx = Transaction.from(txLike)
    const secp256k1Info = await this.client.getKnownScript(KnownScript.Secp256k1Blake160)

    const related: { script: Script; cellDeps: CellDepInfo[] }[] = []
    for (const input of tx.inputs) {
      const cell = await input.getCell(this.client)
      const lock = cell.cellOutput.lock

      if (this.allScripts.some((s) => s.eq(lock))) {
        if (!related.some((r) => r.script.eq(lock))) {
          related.push({
            script: lock,
            cellDeps: secp256k1Info.cellDeps,
          })
        }
      }
    }

    return related
  }

  async signOnlyTransaction(tx: Transaction): Promise<Transaction> {
    return tx
  }

  async prepareTransaction(txLike: TransactionLike): Promise<Transaction> {
    const tx = Transaction.from(txLike)
    const related = await this.getRelatedScripts(tx)

    await Promise.all(
      related.map(async ({ script, cellDeps }) => {
        await tx.prepareSighashAllWitness(script, 65, this.client)
        await tx.addCellDepInfos(this.client, cellDeps)
      })
    )

    return tx
  }
}
