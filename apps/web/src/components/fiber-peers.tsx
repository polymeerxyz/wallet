import { Copy01Icon, RefreshIcon, UserAdd01Icon, UserMultiple02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { PeerInfo } from "@nervosnetwork/fiber-js"
import { Button, Input, Skeleton } from "@polymeer/ui"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { useFiberWorker } from "@/hooks/use-fiber-worker"

const POLL_INTERVAL_MS = 10_000

export function FiberPeers() {
  const fiberWorker = useFiberWorker()
  const [peers, setPeers] = useState<PeerInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [peerAddress, setPeerAddress] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshPeers = async (silent = false) => {
    if (!silent) setIsRefreshing(true)
    try {
      const res = await fiberWorker.listPeers()
      setPeers(res.peers ?? [])
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshPeers(true)
    intervalRef.current = setInterval(() => refreshPeers(true), POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      await refreshPeers(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error("Failed to connect: " + msg)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Peers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-muted-foreground/70 text-[10px] font-bold uppercase">Connected Peers</h3>
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
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : peers.length === 0 ? (
            <div className="text-muted-foreground/50 p-6 text-center text-sm">
              No peers connected yet. Bootnodes may take up to 30s to appear.
            </div>
          ) : (
            <div className="divide-border/30 divide-y">
              {peers.map((peer) => (
                <div
                  key={peer.pubkey}
                  className="hover:bg-muted/10 group flex items-center gap-3 p-4 transition-colors"
                >
                  <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <HugeiconsIcon icon={UserMultiple02Icon} size={16} className="text-primary" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <code className="text-foreground truncate text-xs leading-none font-bold">
                        {peer.pubkey ? peer.pubkey : "Unknown"}
                      </code>
                      {peer.pubkey && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 shrink-0 bg-transparent p-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => {
                            navigator.clipboard.writeText(peer.pubkey)
                            toast.success("Copied to clipboard")
                          }}
                        >
                          <HugeiconsIcon icon={Copy01Icon} size={10} />
                        </Button>
                      )}
                    </div>
                    <p className="text-muted-foreground/60 truncate text-[10px] leading-none font-medium">
                      {peer.address || "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connect Peer Form */}
      <div className="space-y-3">
        <div className="px-1">
          <h3 className="text-muted-foreground/70 text-[10px] font-bold uppercase">Connect to Peer</h3>
        </div>
        <div className="border-border/40 bg-muted/5 space-y-3 rounded-2xl border p-5">
          <div className="bg-background/50 border-border/30 flex items-center rounded-xl border px-3">
            <Input
              id="fiber-peer-address"
              placeholder="/dns4/host/tcp/8228/p2p/QmPubkey…"
              value={peerAddress}
              onChange={(e) => setPeerAddress(e.target.value)}
              className="h-10 border-none bg-transparent text-sm font-bold shadow-none focus-visible:ring-0"
            />
          </div>
          <Button
            className="h-12 w-full rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            <HugeiconsIcon icon={UserAdd01Icon} size={14} className="mr-1.5" />
            {isConnecting ? "Connecting…" : "Connect"}
          </Button>
        </div>
      </div>
    </div>
  )
}
