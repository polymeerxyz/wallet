import { Copy01Icon, RefreshIcon, UserAdd01Icon, UserMultiple02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, Input, Skeleton } from "@polymeer/ui"
import { useState } from "react"
import { toast } from "sonner"

import { useFiberWorker } from "@/hooks/use-fiber-worker"
import { usePeers } from "@/hooks/use-peers"

export function FiberPeers() {
  const fiberWorker = useFiberWorker()
  const { peers, isLoading, isRefetching: isRefreshing, refetchPeers: refreshPeers } = usePeers()
  const [peerAddress, setPeerAddress] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    if (!peerAddress.trim()) {
      toast.error("Please enter a peer address.")
      return
    }
    setIsConnecting(true)
    try {
      await fiberWorker.connectPeer({ address: peerAddress.trim() })
      toast.success("Connected to peer!")
      setPeerAddress("")
      await refreshPeers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error("Failed to connect: " + msg)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Connect Peer Form */}
      <div className="bg-muted/10 ring-border/40 space-y-3 rounded-2xl p-4 ring-1">
        <div className="flex items-center gap-2 px-1">
          <HugeiconsIcon icon={UserAdd01Icon} size={14} className="text-muted-foreground" />
          <h4 className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Connect to New Peer</h4>
        </div>
        <div className="flex gap-2">
          <div className="bg-background/50 border-border/30 flex flex-1 items-center rounded-xl border px-3">
            <Input
              id="fiber-peer-address"
              placeholder="/p2p/QmPubkey…"
              value={peerAddress}
              onChange={(e) => setPeerAddress(e.target.value)}
              className="h-9 border-none bg-transparent text-xs font-bold shadow-none focus-visible:ring-0"
            />
          </div>
          <Button
            size="sm"
            className="h-9 rounded-xl px-4 text-xs font-bold transition-all active:scale-[0.98]"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting…" : "Connect"}
          </Button>
        </div>
      </div>

      {/* Peers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={UserMultiple02Icon} size={14} className="text-muted-foreground" />
            <h4 className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Connected Peers</h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refreshPeers()}
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
          ) : peers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-muted-foreground/40 text-xs font-medium">No peers connected yet.</p>
              <p className="text-muted-foreground/30 mt-1 text-[10px]">Bootnodes may take up to 30s to appear.</p>
            </div>
          ) : (
            <div className="divide-border/30 divide-y">
              {peers.map((peer) => (
                <div
                  key={peer.pubkey}
                  className="hover:bg-muted/10 group flex items-center gap-3 p-3 transition-colors"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <code className="text-foreground truncate text-xs leading-none font-bold">
                        {peer.address ? peer.address : "Unknown"}
                      </code>
                      {peer.address && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 shrink-0 bg-transparent p-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => {
                            navigator.clipboard.writeText(peer.address)
                            toast.success("Copied to clipboard")
                          }}
                        >
                          <HugeiconsIcon icon={Copy01Icon} size={10} />
                        </Button>
                      )}
                    </div>
                    <p className="text-muted-foreground/50 truncate text-[9px] leading-none font-medium">
                      {peer.pubkey || "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
