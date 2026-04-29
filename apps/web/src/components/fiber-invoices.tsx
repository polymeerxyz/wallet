import { type Hex } from "@ckb-ccc/core"
import { Copy01Icon, Invoice01Icon, RefreshIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@polymeer/ui"
import { toast } from "sonner"

import { useFiberWorker } from "@/hooks/use-fiber-worker"
import { useInvoices } from "@/hooks/use-invoices"
import { formatAmount } from "@/lib/utils"
import { useConfigStore } from "@/stores/config.store"
import { useFiberInvoiceStore } from "@/stores/fiber-invoice.store"

export function FiberInvoices() {
  const network = useConfigStore((s) => s.network)
  const { invoices, isRefetching: isRefreshing, refetchInvoices: refreshInvoices } = useInvoices()
  const removeInvoice = useFiberInvoiceStore((s) => s.removeInvoice)
  const fiberWorker = useFiberWorker()

  const handleCancelInvoice = async (paymentHash: string) => {
    try {
      await fiberWorker.cancelInvoice({ payment_hash: paymentHash as Hex })
      toast.success("Invoice cancelled.")
      removeInvoice(network, paymentHash)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error("Failed to cancel invoice: " + msg)
    }
  }

  const handleRemoveInvoice = (paymentHash: string) => {
    removeInvoice(network, paymentHash)
    toast.success("Invoice removed.")
  }

  const copyAddress = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="space-y-4">
      {/* Active Invoices List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-muted-foreground/70 text-[10px] font-bold uppercase">Active Invoices</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refreshInvoices()}
            disabled={isRefreshing}
            className="hover:bg-muted/10 text-muted-foreground/60 h-6 gap-1 px-1.5 text-[10px] font-bold"
          >
            <HugeiconsIcon icon={RefreshIcon} size={10} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
        <div className="border-border/40 bg-muted/5 overflow-hidden rounded-2xl border">
          {invoices.length === 0 ? (
            <div className="text-muted-foreground/50 p-6 text-center text-sm">No active invoices found.</div>
          ) : (
            <div className="divide-border/30 divide-y">
              {invoices.map((inv, idx) => {
                const timestamp = parseInt(inv.invoice.data.timestamp, 16)
                const expiryAttr = inv.invoice.data.attrs.find((a) => "ExpiryTime" in a) as
                  | { ExpiryTime: string }
                  | undefined
                const expirySeconds = expiryAttr ? parseInt(expiryAttr.ExpiryTime, 16) : 0
                const expiresAt = expirySeconds ? timestamp + expirySeconds * 1000 : 0
                const isExpired = expiresAt > 0 && Date.now() > expiresAt
                const status = "status" in inv && inv.status ? inv.status : isExpired ? "Expired" : "Open"
                const canRemove = status !== "Open"

                return (
                  <div
                    key={inv.invoice.data.payment_hash ?? idx}
                    className="hover:bg-muted/10 group flex items-center justify-between p-4 transition-colors"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                        <HugeiconsIcon icon={Invoice01Icon} size={16} className="text-primary" />
                      </div>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <code className="text-foreground truncate text-xs leading-none font-bold">
                            {inv.invoice_address ? inv.invoice_address : "Unknown"}
                          </code>
                          {inv.invoice_address && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 shrink-0 bg-transparent p-0 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() => copyAddress(inv.invoice_address!)}
                            >
                              <HugeiconsIcon icon={Copy01Icon} size={10} />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground/60 truncate text-[10px] leading-none font-medium">
                            {inv.invoice.amount ? formatAmount(BigInt(inv.invoice.amount)) : "0"} {inv.invoice.currency}
                          </span>
                          {(() => {
                            if (status === "Open" && !isExpired && expiresAt > 0) {
                              return (
                                <span className="text-warning truncate text-[9px] leading-none font-bold uppercase">
                                  Expires {new Date(expiresAt).toLocaleTimeString()}
                                </span>
                              )
                            }
                            const isStatusOk = status === "Paid" || status === "Received" || status === "Open"
                            return (
                              <span
                                className={`truncate text-[9px] leading-none font-bold uppercase ${isStatusOk ? "text-primary" : "text-destructive"}`}
                              >
                                {status}
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex shrink-0 items-center gap-2">
                      {canRemove ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground/80 hover:bg-muted/10 hover:text-muted-foreground h-7 rounded-lg text-[10px] font-bold transition-all"
                          onClick={() => handleRemoveInvoice(inv.invoice.data.payment_hash)}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive h-7 rounded-lg text-[10px] font-bold transition-all"
                          onClick={() => handleCancelInvoice(inv.invoice.data.payment_hash)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
