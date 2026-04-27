import type { CkbJsonRpcTransaction } from "@nervosnetwork/fiber-js"
import { create } from "zustand"

export type SigningConfig =
  | { type: "transfer"; payload: { recipient: string; amount: string; feeRate: string } }
  | { type: "dao_deposit"; payload: { amount: string; feeRate: string } }
  | { type: "dao_withdraw" | "dao_claim"; payload: { txHash: string; index: number; feeRate: string } }
  | {
      type: "fiber_open_channel"
      payload: { tx: CkbJsonRpcTransaction; channelId: string; amount: string; feeRate?: string }
    }

interface SigningStore {
  isOpen: boolean
  config: SigningConfig | null
  open: (config: SigningConfig) => void
  close: () => void
}

export const useSigningStore = create<SigningStore>((set) => ({
  isOpen: false,
  config: null,
  open: (config) => set({ isOpen: true, config }),
  close: () => set({ isOpen: false, config: null }),
}))
