import { Button, cn, DropdownMenuItem, useIsMobile } from "@polymeer/ui"
import { useQueryClient } from "@tanstack/react-query"

import { useConfigStore } from "@/stores/config.store"

const networks: { value: "mainnet" | "testnet"; label: string; description: string }[] = [
  { value: "mainnet", label: "Mainnet", description: "Production CKB" },
  { value: "testnet", label: "Testnet", description: "Development" },
]

export function NetworkSwitch() {
  const network = useConfigStore((s) => s.network)
  const setNetwork = useConfigStore((s) => s.setNetwork)
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()

  const handleSelect = async (value: "mainnet" | "testnet") => {
    if (value === network) return
    setNetwork(value)
    await queryClient.invalidateQueries()
  }

  if (isMobile) {
    return (
      <div className="flex flex-wrap gap-2">
        {networks.map(({ value, label }) => (
          <Button
            key={value}
            variant={network === value ? "default" : "outline"}
            size="sm"
            className={cn("h-8 rounded-xl px-3 text-xs font-bold transition-all", network !== value && "bg-muted/30")}
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
      {networks.map(({ value, label, description }) => (
        <DropdownMenuItem
          key={value}
          className="flex flex-col items-start rounded-xl px-3 py-2"
          onSelect={() => handleSelect(value)}
        >
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            {network === value && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">Active</span>
            )}
          </div>
          <span className="text-muted-foreground text-xs">{description}</span>
        </DropdownMenuItem>
      ))}
    </>
  )
}
