import { ClientPublicMainnet, ClientPublicTestnet } from "@ckb-ccc/core"

export function createClient(network: "testnet" | "mainnet") {
  return network === "mainnet" ? new ClientPublicMainnet() : new ClientPublicTestnet()
}
