import { Database01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Skeleton } from "@polymeer/ui"

import { useTip } from "@/hooks/use-tip"

export function BlockNumberIndicator() {
  const { tip, isLoading } = useTip()

  return (
    <div className="fixed top-6 right-6 bottom-auto z-50 sm:top-auto sm:bottom-6">
      <div className="bg-background/40 border-border group hover:bg-background/60 flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-2xl backdrop-blur-xl transition-all sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-2.5">
        <div className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 sm:h-2 sm:w-2"></span>
        </div>

        <div className="flex flex-col">
          <span className="text-muted-foreground/60 hidden text-[8px] font-bold uppercase sm:block sm:text-[9px]">
            Network Status
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
