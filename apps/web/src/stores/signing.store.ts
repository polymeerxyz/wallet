import { create } from "zustand"

export type SigningConfig =
  | { type: "transfer"; payload: { recipient: string; amount: string; feeRate: string } }
  | { type: "dao_deposit"; payload: { amount: string; feeRate: string } }
  | { type: "dao_withdraw" | "dao_claim"; payload: { txHash: string; index: number; feeRate: string } }

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
