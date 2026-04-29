import type { Hex } from "@ckb-ccc/core"
import { hexFrom } from "@ckb-ccc/core"
import { Copy01Icon, Link01Icon, RefreshIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, Input, Skeleton } from "@polymeer/ui"
import { useState } from "react"
import { toast } from "sonner"

import { useAddress } from "@/hooks/use-address"
import { useChannels } from "@/hooks/use-channels"
import { useCkbWorker } from "@/hooks/use-ckb-worker"
import { useFiberWorker } from "@/hooks/use-fiber-worker"
import { formatAmount, parseAmount } from "@/lib/utils"
import { useSigningStore } from "@/stores/signing.store"

const OPEN_CHANNEL_FUNDING_FEE_RATE = 3000n

export function FiberChannels() {
  const { scripts } = useAddress()
  const { open } = useSigningStore()
  const fiberWorker = useFiberWorker()
  const ckbWorker = useCkbWorker()
  const { channels, isLoading, isRefetching: isRefreshing, refetchChannels: refreshChannels } = useChannels()

  const [peerAddress, setPeerAddress] = useState(
    "/dns4/testnet.polymeer.xyz/tcp/443/wss/p2p/QmZPmSNMysTDTHFJ6xLAV8DawnC9mxog8RDMTgV5p8yZU8"
  )
  const [fundingAmount, setFundingAmount] = useState("1000")
  const [isOpeningChannel, setIsOpeningChannel] = useState(false)

  const handleOpenChannel = async () => {
    if (!peerAddress.trim() || !fundingAmount.trim()) {
      toast.error("Please fill in all fields.")
      return
    }
    if (!scripts[0]) {
      toast.error("Wallet not ready.")
      return
    }
    setIsOpeningChannel(true)
    try {
      const address = peerAddress.trim()
      let peers = await fiberWorker.listPeers()
      if (!peers.peers.some((p) => p.address === address)) {
        await fiberWorker.connectPeer({ address, save: true })
      }

      let peer = peers.peers.find((p) => p.address === address)
      if (!peer) {
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 500))
          peers = await fiberWorker.listPeers()
          peer = peers.peers.find((p) => p.address === address)
          if (peer) break
        }
      }

      if (!peer) {
        toast.error("Failed to connect to peer or peer not found after connecting.")
        return
      }
      const pubkey = peer.pubkey

      const shannons = parseAmount(fundingAmount)
      const hexFundingAmount = ("0x" + shannons.toString(16)) as Hex

      const selfScript = {
        code_hash: hexFrom(scripts[0].codeHash) as Hex,
        hash_type: scripts[0].hashType as "type" | "data" | "data1" | "data2",
        args: hexFrom(scripts[0].args) as Hex,
      }

      const resolvedCellDeps = await ckbWorker.getFundingLockCellDeps(scripts[0])
      if (resolvedCellDeps.length === 0) {
        toast.warning(
          "No matching cell deps found for your address scripts. The channel will be opened with a default secp256k1 lock cell dep, which may cause issues if your address is not a standard secp256k1 lock.",
          { duration: 8000 }
        )
      }

      const res = await fiberWorker.openChannelWithExternalFunding({
        pubkey,
        funding_amount: hexFundingAmount,
        public: true,
        shutdown_script: selfScript,
        funding_lock_script: selfScript,
        funding_lock_script_cell_deps: resolvedCellDeps,
        funding_fee_rate: ("0x" + OPEN_CHANNEL_FUNDING_FEE_RATE.toString(16)) as Hex,
      })

      open({
        type: "fiber_open_channel",
        payload: {
          tx: res.unsigned_funding_tx,
          channelId: res.channel_id,
          amount: shannons.toString(),
        },
      })

      setPeerAddress("")
      setFundingAmount("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error("Failed to open channel: " + msg)
    } finally {
      setIsOpeningChannel(false)
    }
  }

  const handleCloseChannel = async (channelId: string, stateName?: string) => {
    console.log(channelId, stateName)
    try {
      if (stateName === "NegotiatingFunding") {
        await fiberWorker.abandonChannel({ channel_id: channelId as Hex })
      } else {
        await fiberWorker.closeChannel({ channel_id: channelId as Hex, force: true })
      }
      toast.success("Channel closed.")
      await refreshChannels()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error("Failed to close channel: " + msg)
    }
  }

  return (
    <div className="space-y-4">
      {/* Active Channels List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-muted-foreground/70 text-[10px] font-bold uppercase">Active Channels</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refreshChannels()}
            disabled={isRefreshing}
            className="hover:bg-muted/10 text-muted-foreground/60 h-6 gap-1 px-1.5 text-[10px] font-bold"
          >
            <HugeiconsIcon icon={RefreshIcon} size={10} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
        <div className="border-border/40 bg-muted/5 overflow-hidden rounded-2xl border">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : channels.length === 0 ? (
            <div className="text-muted-foreground/50 p-6 text-center text-sm">No active channels found.</div>
          ) : (
            <div className="divide-border/30 divide-y">
              {channels.map((ch) => (
                <div
                  key={ch.channel_id}
                  className="hover:bg-muted/10 group flex items-center justify-between p-4 transition-colors"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                      <HugeiconsIcon icon={Link01Icon} size={16} className="text-primary" />
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <code className="text-foreground truncate text-xs leading-none font-bold">
                          {ch.channel_id ? ch.channel_id : "Unknown"}
                        </code>
                        {ch.channel_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 shrink-0 bg-transparent p-0 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => {
                              navigator.clipboard.writeText(ch.channel_id!)
                              toast.success("Copied to clipboard")
                            }}
                          >
                            <HugeiconsIcon icon={Copy01Icon} size={10} />
                          </Button>
                        )}
                      </div>
                      <p className="text-muted-foreground/60 text-[10px] leading-none font-medium">
                        {ch.state?.state_name || "Active"}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-foreground text-sm font-bold">
                        {ch.local_balance ? formatAmount(BigInt(ch.local_balance)) : "0"}
                      </p>
                      <p className="text-muted-foreground/60 text-[10px]">CKB</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive h-7 rounded-lg text-[10px] font-bold transition-all"
                      onClick={() => handleCloseChannel(ch.channel_id, ch.state?.state_name)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Open Channel Form */}
      <div className="space-y-3">
        <div className="px-1">
          <h3 className="text-muted-foreground/70 text-[10px] font-bold uppercase">Open a Channel</h3>
        </div>
        <div className="border-border/40 bg-muted/5 space-y-3 rounded-2xl border p-5">
          <div className="bg-background/50 border-border/30 flex items-center rounded-xl border px-3">
            <Input
              id="fiber-peer-address"
              placeholder="Peer Multiaddr (e.g. /dns4/host/tcp/8228/p2p/QmXxx…)"
              value={peerAddress}
              onChange={(e) => setPeerAddress(e.target.value)}
              className="h-10 border-none bg-transparent text-sm font-bold shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="bg-background/50 border-border/30 flex items-center rounded-xl border px-3">
            <Input
              id="fiber-funding-amount"
              placeholder="Funding Amount"
              value={fundingAmount}
              onChange={(e) => setFundingAmount(e.target.value)}
              className="h-10 border-none bg-transparent text-sm font-bold shadow-none focus-visible:ring-0"
            />
            <span className="text-muted-foreground/40 shrink-0 pr-2 text-[10px] font-bold uppercase">CKB</span>
          </div>
          <Button
            className="h-12 w-full rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
            onClick={handleOpenChannel}
            disabled={isOpeningChannel}
          >
            <HugeiconsIcon icon={Link01Icon} size={14} className="mr-1.5" />
            {isOpeningChannel ? "Opening…" : "Open Channel"}
          </Button>
        </div>
      </div>
    </div>
  )
}
