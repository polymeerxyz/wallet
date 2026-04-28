import type { GetInvoiceResult, InvoiceResult } from "@nervosnetwork/fiber-js"
import { useQuery } from "@tanstack/react-query"

import { useConfigStore } from "@/stores/config.store"
import { useInvoiceStore } from "@/stores/invoice.store"

import { useFiberWorker } from "./use-fiber-worker"

export type ExtendedInvoice = GetInvoiceResult | InvoiceResult

export function useInvoices() {
  const worker = useFiberWorker()
  const network = useConfigStore((s) => s.network)
  const clientMode = useConfigStore((s) => s.clientMode)
  const storedInvoices = useInvoiceStore((s) => s.invoices[network] || [])

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["fiber-invoices", network, clientMode, storedInvoices.map((i) => i.invoice.data.payment_hash)],
    queryFn: async () => {
      if (storedInvoices.length === 0) return []
      const results = await Promise.all(
        storedInvoices.map(async (inv) => {
          try {
            const res = await worker.getInvoice({
              payment_hash: inv.invoice.data.payment_hash as `0x${string}`,
            })
            return {
              ...inv,
              ...res,
            } as ExtendedInvoice
          } catch (e) {
            console.error("Failed to fetch invoice status:", e)
            return inv as ExtendedInvoice
          }
        })
      )
      return results
    },
    refetchInterval: 10000,
    enabled: storedInvoices.length > 0,
    initialData: storedInvoices as ExtendedInvoice[],
  })

  return {
    invoices: data ?? (storedInvoices as ExtendedInvoice[]),
    isLoading,
    isRefetching,
    refetchInvoices: refetch,
  }
}
