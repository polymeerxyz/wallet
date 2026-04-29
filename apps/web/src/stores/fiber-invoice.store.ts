import type { InvoiceResult } from "@nervosnetwork/fiber-js"
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface FiberInvoiceState {
  invoices: Record<string, InvoiceResult[]>
  addInvoice: (network: "mainnet" | "testnet", invoice: InvoiceResult) => void
  removeInvoice: (network: "mainnet" | "testnet", paymentHash: string) => void
}

export const useFiberInvoiceStore = create<FiberInvoiceState>()(
  persist(
    (set) => ({
      invoices: {
        mainnet: [],
        testnet: [],
      },
      addInvoice: (network, invoice) =>
        set((state) => ({
          invoices: {
            ...state.invoices,
            [network]: [...(state.invoices[network] || []), invoice],
          },
        })),
      removeInvoice: (network, paymentHash) =>
        set((state) => ({
          invoices: {
            ...state.invoices,
            [network]: (state.invoices[network] || []).filter((inv) => inv.invoice.data.payment_hash !== paymentHash),
          },
        })),
    }),
    {
      name: "fiber-invoice-storage",
    }
  )
)
