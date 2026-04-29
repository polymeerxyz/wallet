import { MoneySend02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, Input } from "@polymeer/ui"
import { useState } from "react"
import { toast } from "sonner"

import { useFiberWorker } from "@/hooks/use-fiber-worker"

export function FiberSendPayment() {
  const fiberWorker = useFiberWorker()

  const [invoice, setInvoice] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!invoice.trim()) {
      toast.error("Please enter an invoice.")
      return
    }
    setIsSending(true)
    try {
      await fiberWorker.sendPayment({ invoice: invoice.trim() })
      toast.success("Payment sent!")
      setInvoice("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error("Failed to send payment: " + msg)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-background/50 border-border/30 flex items-center rounded-xl border px-3">
        <Input
          id="fiber-pay-input"
          placeholder="Paste invoice string"
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
          className="h-10 border-none bg-transparent text-sm font-bold shadow-none focus-visible:ring-0"
        />
      </div>
      <Button
        className="h-10 w-full rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
        onClick={handleSend}
        disabled={isSending || !invoice.trim()}
      >
        <HugeiconsIcon icon={MoneySend02Icon} size={14} className="mr-2" />
        {isSending ? "Sending…" : "Pay Invoice"}
      </Button>
    </div>
  )
}
