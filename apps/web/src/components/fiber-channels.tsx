import type { Hex } from "@ckb-ccc/core"
import { hexFrom, numToHex, sleep } from "@ckb-ccc/core"
import { Copy01Icon, Link01Icon, RefreshIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
  Skeleton,
} from "@polymeer/ui"
import { useState } from "react"
import { toast } from "sonner"

import { useAddress } from "@/hooks/use-address"
import { useChannels } from "@/hooks/use-channels"
import { useCkbWorker } from "@/hooks/use-ckb-worker"
import { useFiberSettlement } from "@/hooks/use-fiber-settlement"
import { useFiberWorker } from "@/hooks/use-fiber-worker"
import { formatAmount, parseAmount } from "@/lib/utils"
import { useConfigStore } from "@/stores/config.store"
import { useFiberChannelStore } from "@/stores/fiber-channel.store"
import { useFiberPeerStore } from "@/stores/fiber-peer.store"
import { useSigningStore } from "@/stores/signing.store"

const OPEN_CHANNEL_FUNDING_FEE_RATE = 3000n
// Default Fiber commitment delay is 1 epoch ≈ 4 hours
const COMMITMENT_DELAY_MS = 4 * 60 * 60 * 1000

const SETTLING_STATES = new Set(["shuttingdown", "shutting_down", "closed"])

function isSettlingChannel(stateName?: string): boolean {
  const n =
    stateName
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z_]/g, "") ?? ""
  return SETTLING_STATES.has(n)
}

function formatElapsed(closedAt: number): string {
  const ms = Date.now() - closedAt
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h > 0) return `${h}h ${m}m ago`
  return `${m}m ago`
}

function formatRemaining(closedAt: number): string {
  const remaining = COMMITMENT_DELAY_MS - (Date.now() - closedAt)
  if (remaining <= 0) return null as unknown as string
  const h = Math.floor(remaining / 3_600_000)
  const m = Math.floor((remaining % 3_600_000) / 60_000)
  return h > 0 ? `~${h}h ${m}m` : `~${m}m`
}

export function FiberChannels() {
  const { scripts } = useAddress()
  const { open } = useSigningStore()
  const fiberWorker = useFiberWorker()
  const ckbWorker = useCkbWorker()
  const network = useConfigStore((s) => s.network)
  const { channels, isLoading, isRefetching: isRefreshing, refetchChannels: refreshChannels } = useChannels()
  const { pendingSettlement, checkingIds, checkOne } = useFiberSettlement()
  const [peerAddress, setPeerAddress] = useState(
    "/dns4/testnet.polymeer.xyz/tcp/443/wss/p2p/QmZPmSNMysTDTHFJ6xLAV8DawnC9mxog8RDMTgV5p8yZU8"
  )
  const [fundingAmount, setFundingAmount] = useState("1000")
  const [isOpeningChannel, setIsOpeningChannel] = useState(false)

  const activeChannels = channels.filter((ch) => !isSettlingChannel(ch.state?.state_name))

  const addForceCloseChannel = useFiberChannelStore((s) => s.addForceCloseChannel)
  const removeForceCloseChannel = useFiberChannelStore((s) => s.removeForceCloseChannel)
  const savePeerAddress = useFiberPeerStore((s) => s.savePeerAddress)
  const [confirmForceCloseId, setConfirmForceCloseId] = useState<string | null>(null)

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
          await sleep(500)
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
      savePeerAddress(pubkey, address)

      const shannons = parseAmount(fundingAmount)
      const hexFundingAmount = numToHex(shannons)

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
    try {
      if (stateName === "NegotiatingFunding") {
        await fiberWorker.abandonChannel({ channel_id: channelId as Hex })
      } else {
        await fiberWorker.closeChannel({ channel_id: channelId as Hex, force: false })
      }
      toast.success("Close request sent. Waiting for peer to cooperate…")
      await refreshChannels()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error("Failed to close channel: " + msg)
    }
  }

  const handleForceCloseChannel = async (channelId: string) => {
    try {
      const channelInfo = channels.find((ch) => ch.channel_id === channelId)
      const commitmentTxHash = channelInfo?.latest_commitment_transaction_hash

      await fiberWorker.closeChannel({ channel_id: channelId as Hex, force: true })

      if (commitmentTxHash) {
        addForceCloseChannel({
          channelId,
          localBalance: channelInfo?.local_balance ?? "0x0",
          commitmentTxHash,
          closedAt: Date.now(),
          network,
        })
      }

      toast.warning("Force close submitted. Funds will appear in a commitment cell and settle after the delay.")
      await refreshChannels()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error("Failed to force close channel: " + msg)
    } finally {
      setConfirmForceCloseId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Open Channel Form */}
      <div className="bg-muted/10 ring-border/40 space-y-4 rounded-2xl p-4 ring-1">
        <div className="flex items-center gap-2 px-1">
          <HugeiconsIcon icon={Link01Icon} size={14} className="text-muted-foreground" />
          <h4 className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Open New Channel</h4>
        </div>
        <div className="space-y-2">
          <div className="bg-background/50 border-border/30 flex items-center rounded-xl border px-3">
            <Input
              id="fiber-peer-address"
              placeholder="Peer Multiaddr"
              value={peerAddress}
              onChange={(e) => setPeerAddress(e.target.value)}
              className="h-9 border-none bg-transparent text-xs font-bold shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex gap-2">
            <div className="bg-background/50 border-border/30 flex flex-1 items-center rounded-xl border px-3">
              <Input
                id="fiber-funding-amount"
                placeholder="Funding Amount"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
                className="h-9 border-none bg-transparent text-xs font-bold shadow-none focus-visible:ring-0"
              />
              <span className="text-muted-foreground/40 pr-2 text-[10px] font-bold uppercase">CKB</span>
            </div>
            <Button
              size="sm"
              className="h-9 rounded-xl px-4 text-xs font-bold transition-all active:scale-[0.98]"
              onClick={handleOpenChannel}
              disabled={isOpeningChannel}
            >
              {isOpeningChannel ? "Opening…" : "Open"}
            </Button>
          </div>
        </div>
      </div>

      {/* Active Channels List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Link01Icon} size={14} className="text-muted-foreground" />
            <h4 className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Active Channels</h4>
          </div>
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
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : activeChannels.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-muted-foreground/40 text-xs font-medium">No active channels found.</p>
            </div>
          ) : (
            <div className="divide-border/30 divide-y">
              {activeChannels.map((ch) => (
                <div
                  key={ch.channel_id}
                  className="hover:bg-muted/10 group flex items-center justify-between p-3 transition-colors"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <code className="text-foreground truncate text-xs leading-none font-bold">{ch.channel_id}</code>
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
                      </div>
                      <p className="text-muted-foreground/50 text-[9px] leading-none font-medium tracking-tighter uppercase">
                        {ch.state?.state_name || "Active"}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-foreground text-xs font-bold">
                        {ch.local_balance ? formatAmount(BigInt(ch.local_balance)) : "0"}
                      </p>
                      <p className="text-muted-foreground/40 text-[9px] font-bold">CKB</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive h-6 rounded-lg px-2 text-[9px] font-bold"
                        onClick={() => handleCloseChannel(ch.channel_id, ch.state?.state_name)}
                      >
                        Close
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive h-6 rounded-lg px-2 text-[9px] font-bold"
                        onClick={() => setConfirmForceCloseId(ch.channel_id)}
                      >
                        Force
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Settlement List */}
      {pendingSettlement.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-warning h-1 w-1 animate-pulse rounded-full" />
            <h4 className="text-warning/80 text-[10px] font-bold tracking-wider uppercase">Pending Settlement</h4>
          </div>
          <div className="bg-warning/5 border-warning/20 overflow-hidden rounded-2xl border">
            <div className="divide-border/30 divide-y">
              {pendingSettlement.map((record) => {
                const remaining = formatRemaining(record.closedAt)
                const isChecking = checkingIds.has(record.channelId)
                return (
                  <div key={record.channelId} className="flex items-start justify-between p-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <code className="text-foreground truncate text-xs leading-none font-bold">
                        {record.channelId}
                      </code>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-warning text-[9px] font-bold uppercase">Force-Close</span>
                          <span className="text-muted-foreground/40 text-[9px]">{formatElapsed(record.closedAt)}</span>
                        </div>
                        {record.localBalance && record.localBalance !== "0x0" && (
                          <p className="text-muted-foreground/60 text-[9px] font-medium">
                            {formatAmount(BigInt(record.localBalance))} CKB locked
                          </p>
                        )}
                        <p
                          className={
                            remaining ? "text-muted-foreground/40 text-[9px]" : "text-primary/70 text-[9px] font-bold"
                          }
                        >
                          {remaining ? `Available in ${remaining}` : "Settlement available"}
                        </p>
                      </div>
                    </div>
                    <div className="ml-3 flex shrink-0 flex-col items-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isChecking}
                        className="text-primary/80 hover:text-primary h-6 px-2 text-[9px] font-bold"
                        onClick={() => checkOne(record.channelId, record.commitmentTxHash)}
                      >
                        {isChecking ? "Checking…" : "Check"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground/30 hover:text-muted-foreground h-6 px-2 text-[9px]"
                        onClick={() => removeForceCloseChannel(record.channelId, network)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Force Close Confirmation Dialog */}
      <AlertDialog open={confirmForceCloseId !== null} onOpenChange={(open) => !open && setConfirmForceCloseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <HugeiconsIcon icon={Link01Icon} size={20} />
              Confirm Force Close
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>Force closing a channel will broadcast your latest commitment transaction to the network.</p>
              <div className="bg-destructive/5 border-destructive/20 rounded-xl border p-4">
                <p className="text-destructive text-xs leading-relaxed font-bold">
                  DANGER: Your funds will be locked in a commitment cell and will require a manual settlement
                  transaction after a ~4 hour delay before they become spendable again.
                </p>
              </div>
              <p className="text-xs">
                Only use this if your peer is permanently offline or unresponsive. Cooperated closes are safer and
                faster.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted/10 rounded-xl border-none font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold"
              onClick={() => confirmForceCloseId && handleForceCloseChannel(confirmForceCloseId)}
            >
              Force Close Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
