import { Button, cn, DropdownMenuItem, useIsMobile } from "@polymeer/ui"
import { useQueryClient } from "@tanstack/react-query"

import { useCkbWorker } from "@/hooks/use-ckb-worker"
import { useConfigStore } from "@/stores/config.store"

const modes: { value: "light" | "full"; label: string; description: string }[] = [
  { value: "light", label: "Light Node", description: "WASM" },
  { value: "full", label: "Full Node", description: "Public RPC" },
]

export function NodeModeSwitch() {
  const clientMode = useConfigStore((s) => s.clientMode)
  const setClientMode = useConfigStore((s) => s.setClientMode)
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()

  const handleSelect = async (mode: "light" | "full") => {
    if (mode === clientMode) return
    setClientMode(mode)
    await queryClient.invalidateQueries()
  }

  if (isMobile) {
    return (
      <div className="flex flex-wrap gap-2">
        {modes.map(({ value, label }) => (
          <Button
            key={value}
            variant={clientMode === value ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 rounded-xl px-3 text-xs font-bold transition-all",
              clientMode !== value && "bg-muted/30"
            )}
            onClick={() => handleSelect(value)}
          >
            {label}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <>
      {modes.map(({ value, label, description }) => (
        <DropdownMenuItem
          key={value}
          className="flex flex-col items-start rounded-xl px-3 py-2"
          onSelect={() => handleSelect(value)}
        >
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            {clientMode === value && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">Active</span>
            )}
          </div>
          <span className="text-muted-foreground text-xs">{description}</span>
        </DropdownMenuItem>
      ))}
    </>
  )
}
