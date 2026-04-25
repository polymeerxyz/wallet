import { numFrom, type NumLike } from "@ckb-ccc/core"

export function formatAmount(amount: NumLike): string {
  const val = numFrom(amount)
  return (Number(val) / 10 ** 8).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })
}

export function getExplorerLink(id: string, network: string, type: "transaction" | "address" = "transaction") {
  const baseUrl = network === "mainnet" ? "https://explorer.nervos.org" : "https://testnet.explorer.nervos.org"
  return `${baseUrl}/${type}/${id}`
}
