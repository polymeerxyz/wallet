import { create } from "zustand"
import { persist } from "zustand/middleware"

interface PendingDaoTx {
  txHash: string
  type: "deposit" | "withdraw" | "claim"
  amount?: string
  timestamp: number
}

interface DaoState {
  pendingTransactions: PendingDaoTx[]

  addPendingTransaction: (tx: PendingDaoTx) => void
  removePendingTransaction: (txHash: string) => void
  clearPendingTransactions: () => void
}

export const useDaoStore = create<DaoState>()(
  persist(
    (set) => ({
      pendingTransactions: [],
      addPendingTransaction: (tx) =>
        set((state) => ({
          pendingTransactions: [...state.pendingTransactions, tx],
        })),
      removePendingTransaction: (txHash) =>
        set((state) => ({
          pendingTransactions: state.pendingTransactions.filter((tx) => tx.txHash !== txHash),
        })),
      clearPendingTransactions: () => set({ pendingTransactions: [] }),
    }),
    {
      name: "dao-storage",
    }
  )
)
