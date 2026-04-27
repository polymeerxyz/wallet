import type { Hex } from "@ckb-ccc/core"

export function generatePreimage(): Hex {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return `0x${hex}`
}

export function isValidPreimage(value: unknown): value is Hex {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value)
}
