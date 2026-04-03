import type { Client, Script } from "@ckb-ccc/core"

export async function getBalanceForScripts(client: Client, scripts: Script[]) {
  const balance = await client.getBalance(scripts)
  return balance.toString()
}
