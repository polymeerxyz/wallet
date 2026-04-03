import { Copy01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@polymeer/ui"
import { QRCodeSVG } from "qrcode.react"
import type { ReactNode } from "react"

interface ReceiveDialogProps {
  address: string | undefined
  children?: ReactNode
}

export function ReceiveDialog({ address, children }: ReceiveDialogProps) {
  const truncateAddress = (addr: string) => {
    if (addr.length <= 27) return addr
    return `${addr.slice(0, 12)}...${addr.slice(-12)}`
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="secondary"
            className="bg-muted/30 hover:bg-muted/50 h-14 w-full rounded-2xl border-none text-base font-bold transition-all active:scale-[0.98]"
          >
            Receive
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-background w-full max-w-[90vw] overflow-hidden rounded-[2rem] border-none p-6 shadow-2xl sm:max-w-[400px] md:rounded-3xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-center text-xl font-bold">Receive Assets</DialogTitle>
          <DialogDescription className="text-muted-foreground/60 text-center text-xs font-medium">
            Scan QR or copy address
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full flex-col items-center justify-center gap-6">
          <div className="border-border/10 mx-auto flex aspect-square w-full max-w-[240px] items-center justify-center rounded-2xl border bg-white p-4">
            {address && <QRCodeSVG value={address} size={200} className="h-full w-full" level="H" />}
          </div>
          <div className="space-y-2">
            <div className="bg-muted/10 border-border/50 flex items-center gap-2 rounded-xl border p-3">
              <p className="text-foreground flex-1 truncate text-xs leading-none font-medium">
                {truncateAddress(address || "")}
              </p>
              <Button size="icon" variant="ghost" onClick={copyAddress} className="h-8 w-8 shrink-0 rounded-lg">
                <HugeiconsIcon icon={Copy01Icon} size={14} />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
