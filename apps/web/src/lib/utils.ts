import { numFrom, type NumLike } from "@ckb-ccc/core"

export function formatAmount(amount: NumLike): string {
  const val = numFrom(amount)
  return (Number(val) / 10 ** 8).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })
}

export function parseAmount(amountStr: string, decimals: number = 8): bigint {
  if (!amountStr) return 0n
  const [intPart, fracPart = ""] = amountStr.split(".")
  const frac = fracPart.slice(0, decimals).padEnd(decimals, "0")
  return BigInt(`${intPart || "0"}${frac}`)
}

export function getExplorerLink(id: string, network: string, type: "transaction" | "address" = "transaction") {
  const baseUrl = network === "mainnet" ? "https://explorer.nervos.org" : "https://testnet.explorer.nervos.org"
  return `${baseUrl}/${type}/${id}`
}
