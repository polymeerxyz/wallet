import type { Hex } from "@ckb-ccc/core"
import { Copy01Icon, Invoice01Icon, MoneyReceive02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, Input } from "@polymeer/ui"
import { useState } from "react"
import { toast } from "sonner"

import { useFiberWorker } from "@/hooks/use-fiber-worker"
import { generatePreimage } from "@/lib/preimage"
import { formatAmount, parseAmount } from "@/lib/utils"
import { useConfigStore } from "@/stores/config.store"
import { useInvoiceStore } from "@/stores/invoice.store"

export function FiberInvoices() {
  const network = useConfigStore((s) => s.network)
  const invoices = useInvoiceStore((s) => s.invoices[network] || [])
  const addInvoice = useInvoiceStore((s) => s.addInvoice)
  const removeInvoice = useInvoiceStore((s) => s.removeInvoice)
  const fiberWorker = useFiberWorker()
  const [invoiceAmount, setInvoiceAmount] = useState("")
  const [invoiceExpiry, setInvoiceExpiry] = useState("10")
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)

  const handleCreateInvoice = async () => {
    if (!invoiceAmount.trim()) {
      toast.error("Please enter an amount.")
      return
    }
    const expiryMins = Number(invoiceExpiry)
    if (isNaN(expiryMins) || expiryMins < 5 || expiryMins > 60) {
      toast.error("Expiry must be between 5 and 60 minutes.")
      return
    }
    setIsCreatingInvoice(true)
    try {
      const shannons = parseAmount(invoiceAmount)
      const hexInvoiceAmount = ("0x" + shannons.toString(16)) as Hex
      const expirySeconds = Math.floor(expiryMins * 60)
      const hexExpiry = ("0x" + expirySeconds.toString(16)) as Hex
      const res = await fiberWorker.createInvoice({
        amount: hexInvoiceAmount,
        currency: network === "mainnet" ? "Fibb" : "Fibt",
        payment_preimage: generatePreimage(),
        expiry: hexExpiry,
      })
      toast.success("Invoice created!")
      addInvoice(network, res)
      setInvoiceAmount("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error("Failed to create invoice: " + msg)
    } finally {
      setIsCreatingInvoice(false)
    }
  }

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

  const copyAddress = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="space-y-4">
      {/* Active Invoices List */}
      <div className="space-y-3">
        <div className="px-1">
          <h3 className="text-muted-foreground/70 text-[10px] font-bold uppercase">Active Invoices</h3>
        </div>
        <div className="border-border/40 bg-muted/5 overflow-hidden rounded-2xl border">
          {invoices.length === 0 ? (
            <div className="text-muted-foreground/50 p-6 text-center text-sm">No active invoices found.</div>
          ) : (
            <div className="divide-border/30 divide-y">
              {invoices.map((inv, idx) => (
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
                          const timestamp = parseInt(inv.invoice.data.timestamp, 16)
                          const expiryAttr = inv.invoice.data.attrs.find((a) => "ExpiryTime" in a) as
                            | { ExpiryTime: string }
                            | undefined
                          const expirySeconds = expiryAttr ? parseInt(expiryAttr.ExpiryTime, 16) : 0
                          if (!expirySeconds) return null
                          const expiresAt = timestamp + expirySeconds * 1000
                          const isExpired = Date.now() > expiresAt
                          return (
                            <span
                              className={`truncate text-[9px] leading-none font-bold uppercase ${
                                isExpired ? "text-destructive" : "text-warning"
                              }`}
                            >
                              {isExpired ? "Expired" : `Expires ${new Date(expiresAt).toLocaleTimeString()}`}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive h-7 rounded-lg text-[10px] font-bold transition-all"
                      onClick={() => handleCancelInvoice(inv.invoice.data.payment_hash)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Invoice Form */}
      <div className="space-y-3">
        <div className="px-1">
          <h3 className="text-muted-foreground/70 text-[10px] font-bold uppercase">Create Invoice</h3>
        </div>
        <div className="border-border/40 bg-muted/5 space-y-3 rounded-2xl border p-5">
          <div className="flex gap-2">
            <div className="bg-background/50 border-border/30 flex flex-1 items-center rounded-xl border px-3">
              <Input
                id="fiber-invoice-amount"
                placeholder="Amount"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                className="h-10 border-none bg-transparent text-sm font-bold shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="bg-background/50 border-border/30 flex items-center rounded-xl border px-3">
              <Input
                id="fiber-invoice-expiry"
                type="number"
                placeholder="Mins"
                value={invoiceExpiry}
                onChange={(e) => setInvoiceExpiry(e.target.value)}
                className="h-10 w-16 border-none bg-transparent text-center text-sm font-bold shadow-none focus-visible:ring-0"
              />
              <span className="text-muted-foreground/40 shrink-0 text-[10px] font-bold uppercase">Mins</span>
            </div>
          </div>
          <Button
            className="h-12 w-full rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
            onClick={handleCreateInvoice}
            disabled={isCreatingInvoice}
          >
            <HugeiconsIcon icon={MoneyReceive02Icon} size={14} className="mr-1.5" />
            {isCreatingInvoice ? "Creating…" : "Create Invoice"}
          </Button>
        </div>
      </div>
    </div>
  )
}
