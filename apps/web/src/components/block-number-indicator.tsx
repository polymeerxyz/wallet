import { Database01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Skeleton } from "@polymeer/ui"

import { useTip } from "@/hooks/use-tip"

export function BlockNumberIndicator() {
  const { tip, isLoading } = useTip()

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <div className="bg-background/40 border-border group hover:bg-background/60 flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-2xl backdrop-blur-xl transition-all">
        <div className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </div>

        <div className="flex flex-col">
          <span className="text-muted-foreground/60 text-[9px] font-bold uppercase">Network Status</span>
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
  )
}
