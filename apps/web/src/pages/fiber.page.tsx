import { MoneySend02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, Input, Tabs, TabsContent, TabsList, TabsTrigger } from "@polymeer/ui"
import { Link, Navigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { FiberChannels } from "@/components/fiber-channels"
import { FiberInvoices } from "@/components/fiber-invoices"
import { FiberPeers } from "@/components/fiber-peers"
import { useFiberWorker } from "@/hooks/use-fiber-worker"
import { useConfigStore } from "@/stores/config.store"

export function FiberPage() {
  const network = useConfigStore((s) => s.network)

  const fiberWorker = useFiberWorker()
  const [targetInvoice, setTargetInvoice] = useState("")
  const [isSendingPayment, setIsSendingPayment] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (network !== "testnet") return
    fiberWorker
      .updateConfig()
      .then(() => setIsReady(true))
      .catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSendPayment = async () => {
    if (!targetInvoice.trim()) {
      toast.error("Please enter an invoice.")
      return
    }
    setIsSendingPayment(true)
    try {
      await fiberWorker.sendPayment({ invoice: targetInvoice })
      toast.success("Payment sent!")
      setTargetInvoice("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error("Failed to send payment: " + msg)
    } finally {
      setIsSendingPayment(false)
    }
  }

  return network !== "testnet" ? (
    <Navigate to="/" />
  ) : (
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-4xl space-y-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">Fiber Network</h1>
          <p className="text-muted-foreground/50 text-[10px] font-semibold uppercase">Lightning</p>
        </div>
      </div>

      {/* Send Payment */}
      <section className="space-y-3">
        <div className="px-1">
          <h3 className="text-muted-foreground/70 text-[10px] font-bold uppercase">Send Payment</h3>
        </div>
        <div className="border-border/40 bg-muted/5 space-y-3 rounded-2xl border p-5">
          <div className="bg-background/50 border-border/30 flex items-center rounded-xl border px-3">
            <Input
              id="fiber-target-invoice"
              placeholder="Paste invoice string"
              value={targetInvoice}
              onChange={(e) => setTargetInvoice(e.target.value)}
              className="h-10 border-none bg-transparent text-sm font-bold shadow-none focus-visible:ring-0"
            />
          </div>
          <Button
            className="h-12 w-full rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
            onClick={handleSendPayment}
            disabled={isSendingPayment}
          >
            <HugeiconsIcon icon={MoneySend02Icon} size={14} className="mr-1.5" />
            {isSendingPayment ? "Sending…" : "Pay Invoice"}
          </Button>
        </div>
      </section>

      {/* Channels & Invoices Tabs */}
      <section>
        <Tabs defaultValue="channels">
          <TabsList>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="peers">Peers</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="mt-4">
            {isReady && <FiberChannels />}
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            {isReady && <FiberInvoices />}
          </TabsContent>

          <TabsContent value="peers" className="mt-4">
            {isReady && <FiberPeers />}
          </TabsContent>
        </Tabs>
      </section>

      <div className="flex justify-center pt-4">
        <Link
          to="/"
          className="text-muted-foreground/60 hover:text-primary text-[10px] font-bold uppercase transition-colors"
        >
          Back to Overview
        </Link>
      </div>
    </div>
  )
}
