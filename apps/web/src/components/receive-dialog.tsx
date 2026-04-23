import { ArrowDown01Icon, Copy01Icon, Link01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@polymeer/ui"
import { QRCodeSVG } from "qrcode.react"
import type { ReactNode } from "react"

import { getExplorerLink } from "@/lib/utils"
import { useConfigStore } from "@/stores/config.store"

interface ReceiveDialogProps {
  address: string | undefined
  children?: ReactNode
}

export function ReceiveDialog({ address, children }: ReceiveDialogProps) {
  const network = useConfigStore((s) => s.network)
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
      <DialogContent className="bg-background max-w-[90vw] overflow-hidden rounded-3xl border-none p-0 shadow-2xl sm:max-w-[360px]">
        {/* Standardized Header with Icon */}
        <div className="bg-muted/5 border-border/10 flex flex-col items-center border-b p-6 text-center">
          <div className="bg-primary/10 mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
            <HugeiconsIcon icon={ArrowDown01Icon} className="text-primary" size={28} />
          </div>
          <DialogTitle className="text-lg font-bold">Receive Assets</DialogTitle>
          <DialogDescription className="text-muted-foreground/70 text-tiny mt-0.5 font-semibold uppercase">
            Your CKB Wallet Address
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-6 p-6 pt-4">
          <div className="group relative mx-auto flex aspect-square w-full max-w-[200px] items-center justify-center">
            <div className="border-border/10 group-hover:border-primary/20 absolute inset-0 rounded-2xl border-2 transition-colors" />
            <div className="bg-white p-3 transition-transform group-hover:scale-95">
              {address && <QRCodeSVG value={address} size={160} className="h-full w-full" level="H" />}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-muted/5 border-border/40 relative rounded-2xl border p-3.5 text-center">
              <span className="text-muted-foreground bg-background text-tiny absolute -top-2 left-4 px-2 font-semibold uppercase">
                Public Address
              </span>
              <p className="text-foreground mt-1 text-xs leading-relaxed font-normal break-all opacity-90">{address}</p>
            </div>

            <div className="flex gap-2">
              <Button className="h-12 flex-1 rounded-2xl text-sm font-bold active:scale-[0.98]" onClick={copyAddress}>
                <HugeiconsIcon icon={Copy01Icon} size={16} className="mr-2" />
                Copy Address
              </Button>
              <Button
                variant="outline"
                className="border-border/30 h-12 w-12 rounded-2xl p-0 active:scale-[0.98]"
                asChild
              >
                <a
                  href={getExplorerLink(address || "", network, "address")}
                  target="_blank"
                  rel="noreferrer"
                  title="View on Explorer"
                >
                  <HugeiconsIcon icon={Link01Icon} size={18} />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
