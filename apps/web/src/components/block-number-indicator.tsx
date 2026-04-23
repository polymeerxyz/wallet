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
    <div className="fixed top-6 right-6 bottom-auto z-50 sm:top-auto sm:bottom-6">
      <div className="bg-background/40 border-border group hover:bg-background/60 relative flex items-center gap-2 overflow-hidden rounded-xl border px-3 py-1.5 shadow-2xl backdrop-blur-xl transition-all sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-2.5">
        {isSyncing && (
          <div className="bg-warning/30 absolute bottom-0 left-0 h-0.5 w-full">
            <div className="bg-warning h-full transition-all duration-1000" style={{ width: `${syncProgress}%` }} />
          </div>
        )}

        <div className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isSyncing ? "bg-warning" : "bg-success"}`}
          />
          <span
            className={`relative inline-flex h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${isSyncing ? "bg-warning" : "bg-success"}`}
          />
        </div>

        <div className="flex flex-col">
          <span className="text-muted-foreground/60 hidden text-[8px] font-bold uppercase sm:block sm:text-[9px]">
            {network.toUpperCase()} • {clientMode.toUpperCase()}
            {isSyncing && ` • ${syncProgress}%`}
          </span>
          {isLoading ? (
            <Skeleton className="h-3 w-12 sm:h-4 sm:w-20" />
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <HugeiconsIcon icon={Database01Icon} size={10} className="text-muted-foreground/80 hidden sm:block" />
              <span className="text-foreground text-[10px] font-bold tabular-nums sm:text-xs">
                {Number(tip?.number || 0).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
