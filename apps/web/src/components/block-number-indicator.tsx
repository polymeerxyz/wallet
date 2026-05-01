import { Database01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Skeleton } from "@polymeer/ui"

import { useTip } from "@/hooks/use-tip"
import { useConfigStore } from "@/stores/config.store"

export function BlockNumberIndicator() {
  const { tip, syncProgress, isLoading } = useTip()
  const network = useConfigStore((s) => s.network)
  const clientMode = useConfigStore((s) => s.clientMode)
  const isSyncing = syncProgress < 100

  return (
    <>
      {/* Mobile: fixed full-width status bar at the top */}
      <div className="border-border/20 bg-background/60 fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-xl sm:hidden">
        {isSyncing && (
          <div className="bg-warning/30 absolute bottom-0 left-0 h-0.5 w-full">
            <div className="bg-warning h-full transition-all duration-1000" style={{ width: `${syncProgress}%` }} />
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="relative flex h-1.5 w-1.5">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isSyncing ? "bg-warning" : "bg-success"}`}
              />
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isSyncing ? "bg-warning" : "bg-success"}`}
              />
            </div>
            <span className="text-muted-foreground/60 text-[7px] font-bold tracking-widest uppercase">
              {network.toUpperCase()} • {clientMode.toUpperCase()}
              {isSyncing && ` • ${syncProgress}%`}
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-3 w-12" />
          ) : (
            <span className="text-foreground text-[9px] font-bold tabular-nums">
              {Number(tip?.number || 0).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Desktop: floating pill */}
      <div className="fixed right-6 bottom-6 z-50 hidden sm:block">
        <div className="bg-background/40 border-border group hover:bg-background/60 relative flex items-center gap-3 overflow-hidden rounded-2xl border px-4 py-2.5 shadow-xl backdrop-blur-xl transition-all">
          {isSyncing && (
            <div className="bg-warning/30 absolute bottom-0 left-0 h-0.5 w-full">
              <div className="bg-warning h-full transition-all duration-1000" style={{ width: `${syncProgress}%` }} />
            </div>
          )}

          <div className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isSyncing ? "bg-warning" : "bg-success"}`}
            />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${isSyncing ? "bg-warning" : "bg-success"}`} />
          </div>

          <div className="flex flex-col">
            <span className="text-muted-foreground/60 text-[9px] font-bold uppercase">
              {network.toUpperCase()} • {clientMode.toUpperCase()}
              {isSyncing && ` • ${syncProgress}%`}
            </span>
            {isLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Database01Icon} size={10} className="text-muted-foreground/80" />
                <span className="text-foreground text-xs font-bold tabular-nums">
                  {Number(tip?.number || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
