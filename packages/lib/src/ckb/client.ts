import { type Client, type ClientBlockHeader, type Hex, Transaction, type TransactionLike } from "@ckb-ccc/core"

/**
 * Get the tip header from the blockchain.
 */
export async function getTipHeader(client: Client): Promise<ClientBlockHeader> {
  return client.getTipHeader()
}

/**
 * Send a signed transaction to the blockchain.
 */
export async function sendTransaction(client: Client, tx: TransactionLike): Promise<Hex> {
  return client.sendTransaction(Transaction.from(tx))
}
