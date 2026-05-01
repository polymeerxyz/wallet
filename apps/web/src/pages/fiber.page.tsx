import { Invoice01Icon, Link02Icon, UserMultiple02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@polymeer/ui"
import { Link, Navigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { FiberChannels } from "@/components/fiber-channels"
import { FiberCreateInvoice } from "@/components/fiber-create-invoice"
import { FiberInvoices } from "@/components/fiber-invoices"
import { FiberPeers } from "@/components/fiber-peers"
import { FiberSendPayment } from "@/components/fiber-send-payment"
import { useChannels } from "@/hooks/use-channels"
import { useFiberWorker } from "@/hooks/use-fiber-worker"
import { usePeers } from "@/hooks/use-peers"
import { useConfigStore } from "@/stores/config.store"
import { useFiberChannelStore } from "@/stores/fiber-channel.store"

const SETTLING_STATES = new Set(["shuttingdown", "shutting_down", "closed"])

function isSettlingChannel(stateName?: string): boolean {
  const n =
    stateName
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z_]/g, "") ?? ""
  return SETTLING_STATES.has(n)
}

export function FiberPage() {
  const network = useConfigStore((s) => s.network)
  const clientMode = useConfigStore((s) => s.clientMode)
  const forceCloseChannels = useFiberChannelStore((s) => s.forceCloseChannels)
  const fiberWorker = useFiberWorker()
  const [isReady, setIsReady] = useState(false)

  const { channels } = useChannels(isReady)
  const { peers } = usePeers(isReady)

  const activeChannels = channels.filter((ch) => !isSettlingChannel(ch.state?.state_name))
  const pendingSettlement = forceCloseChannels.filter((r) => r.network === network)

  useEffect(() => {
    if (network !== "testnet") return
    fiberWorker
      .updateConfig({ network, clientMode })
      .then(() => setIsReady(true))
      .catch(console.error)
  }, [clientMode, fiberWorker, network])

  return network !== "testnet" ? (
    <Navigate to="/" />
  ) : (
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-4xl space-y-6 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Fiber Network</h1>
          <p className="text-muted-foreground/50 text-[10px] font-semibold tracking-wider uppercase">
            Lightning on CKB
          </p>
        </div>
        <Link
          to="/"
          className="text-muted-foreground/60 hover:text-primary text-[10px] font-bold uppercase transition-colors"
        >
          Back to Overview
        </Link>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Peers Summary */}
        <Drawer>
          <DrawerTrigger asChild>
            <button className="hover:bg-muted/10 border-border/40 bg-muted/5 flex flex-col items-center justify-center gap-2 rounded-3xl border p-6 transition-all active:scale-[0.98]">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <HugeiconsIcon icon={UserMultiple02Icon} size={20} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="text-2xl leading-none font-bold">{peers.length}</p>
                <p className="text-muted-foreground/60 mt-1 text-[10px] font-bold uppercase">Connected Peers</p>
                <p className="text-muted-foreground/40 mt-1 text-[10px]">Active network connections</p>
              </div>
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Fiber Peers</DrawerTitle>
            </DrawerHeader>
            <div className="max-h-[70vh] overflow-y-auto px-4 pb-6">{isReady && <FiberPeers />}</div>
          </DrawerContent>
        </Drawer>

        {/* Channels Summary */}
        <Drawer>
          <DrawerTrigger asChild>
            <button className="hover:bg-muted/10 border-border/40 bg-muted/5 flex flex-col items-center justify-center gap-2 rounded-3xl border p-6 transition-all active:scale-[0.98]">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <HugeiconsIcon icon={Link02Icon} size={20} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="text-2xl leading-none font-bold">{activeChannels.length}</p>
                <p className="text-muted-foreground/60 mt-1 text-[10px] font-bold uppercase">
                  {pendingSettlement.length > 0 ? (
                    <span className="text-warning">
                      {activeChannels.length} Active • {pendingSettlement.length} Settling
                    </span>
                  ) : (
                    "Active Channels"
                  )}
                </p>
                <p className="text-muted-foreground/40 mt-1 text-[10px]">Open Lightning payment lanes</p>
              </div>
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Fiber Channels</DrawerTitle>
            </DrawerHeader>
            <div className="max-h-[70vh] overflow-y-auto px-4 pb-6">{isReady && <FiberChannels />}</div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Main Action Area - Split into Send and Receive */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Send Payment Block */}
        <section className="border-border/40 bg-muted/5 space-y-4 rounded-3xl border p-6">
          <div className="space-y-3">
            <div className="px-1">
              <h3 className="text-muted-foreground/70 text-[10px] font-bold tracking-wider uppercase">Send Payment</h3>
              <p className="text-muted-foreground/50 mt-1 text-[10px]">Paste a Fiber invoice to pay instantly.</p>
            </div>
            <div className="bg-background/50 border-border/30 focus-within:border-primary/30 flex flex-col gap-3 rounded-2xl border p-4 transition-all">
              <FiberSendPayment />
            </div>
          </div>
        </section>

        {/* Receive Payment Block */}
        <section className="border-border/40 bg-muted/5 space-y-4 rounded-3xl border p-6">
          <div className="space-y-3">
            <div className="px-1">
              <h3 className="text-muted-foreground/70 text-[10px] font-bold tracking-wider uppercase">
                Receive Payment
              </h3>
              <p className="text-muted-foreground/50 mt-1 text-[10px]">
                Enter amount and expiry to generate an invoice.
              </p>
            </div>
            <div className="bg-background/50 border-border/30 focus-within:border-primary/30 flex flex-col gap-3 rounded-2xl border p-4 transition-all">
              <FiberCreateInvoice />
            </div>
          </div>
        </section>
      </div>

      {/* Invoice List */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <HugeiconsIcon icon={Invoice01Icon} size={12} className="text-muted-foreground/50" />
          <h3 className="text-muted-foreground/70 text-[10px] font-bold tracking-wider uppercase">Invoice History</h3>
        </div>
        {isReady && <FiberInvoices />}
      </section>
    </div>
  )
}
