import { Database01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { DropdownMenuItem } from "@polymeer/ui"

import { useWalletStore } from "@/stores/wallet.store"

export function NetworkSwitch() {
  const network = useWalletStore((state) => state.network)
  const setPendingNetwork = useWalletStore((state) => state.setPendingNetwork)

  const handleNetworkSelect = (nextNetwork: "testnet" | "mainnet") => {
    if (nextNetwork === network) return
    setPendingNetwork(nextNetwork)
  }

  return (
    <>
      <DropdownMenuItem className="flex items-center justify-between" onClick={() => handleNetworkSelect("testnet")}>
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Database01Icon} size={14} className="text-muted-foreground/50" />
          <span>Testnet</span>
        </div>
        {network === "testnet" && <HugeiconsIcon icon={Tick02Icon} size={14} className="text-emerald-500" />}
      </DropdownMenuItem>
      <DropdownMenuItem className="flex items-center justify-between" onClick={() => handleNetworkSelect("mainnet")}>
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Database01Icon} size={14} className="text-muted-foreground/50" />
          <span>Mainnet</span>
        </div>
        {network === "mainnet" && <HugeiconsIcon icon={Tick02Icon} size={14} className="text-emerald-500" />}
      </DropdownMenuItem>
    </>
  )
}
