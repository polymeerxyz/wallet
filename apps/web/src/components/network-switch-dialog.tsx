import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@polymeer/ui"

import { useWalletStore } from "@/stores/wallet.store"

export function NetworkSwitchDialog() {
  const network = useWalletStore((state) => state.network)
  const pendingNetwork = useWalletStore((state) => state.pendingNetwork)
  const setNetwork = useWalletStore((state) => state.setNetwork)
  const setPendingNetwork = useWalletStore((state) => state.setPendingNetwork)

  const handleClose = () => {
    setPendingNetwork(null)
  }

  const confirmSwitch = () => {
    if (pendingNetwork) {
      setNetwork(pendingNetwork)
    }
    handleClose()
  }

  return (
    <Dialog open={!!pendingNetwork} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Switch Network?</DialogTitle>
          <DialogDescription>
            You are about to switch from <strong className="capitalize">{network}</strong> to{" "}
            <strong className="capitalize">{pendingNetwork}</strong>. Your wallet data and worker will be re-initialized
            for the new network.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={confirmSwitch}>Confirm Switch</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
