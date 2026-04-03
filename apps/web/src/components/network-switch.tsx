import { Database01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@polymeer/ui"
import { useState } from "react"

import { useWalletStore } from "@/stores/wallet.store"

export function NetworkSwitch() {
  const network = useWalletStore((state) => state.network)
  const setNetwork = useWalletStore((state) => state.setNetwork)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pendingNetwork, setPendingNetwork] = useState<"testnet" | "mainnet" | null>(null)

  const handleNetworkSelect = (nextNetwork: "testnet" | "mainnet") => {
    if (nextNetwork === network) return
    setPendingNetwork(nextNetwork)
    setIsDialogOpen(true)
  }

  const confirmSwitch = () => {
    if (pendingNetwork) {
      setNetwork(pendingNetwork)
    }
    setIsDialogOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-background/80 h-9 gap-2 rounded-xl border-none px-3 shadow-none"
          >
            <HugeiconsIcon icon={Database01Icon} size={14} className="text-muted-foreground" />
            <span className="text-xs font-bold tracking-wider uppercase">{network}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Switch Network</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center justify-between"
            onClick={() => handleNetworkSelect("testnet")}
          >
            Testnet
            {network === "testnet" && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center justify-between"
            onClick={() => handleNetworkSelect("mainnet")}
          >
            Mainnet
            {network === "mainnet" && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Network?</DialogTitle>
            <DialogDescription>
              You are about to switch to <strong>{pendingNetwork}</strong>. Your wallet data and worker will be
              re-initialized for the new network.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSwitch}>Confirm Switch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
