import { Copy01Icon, Link01Icon, QrCode01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  toast,
} from "@polymeer/ui"
import { QRCodeSVG } from "qrcode.react"
import { useMemo } from "react"

import { useWalletStore } from "@/stores/wallet.store"

export function SyncWalletDialog() {
  const { publicKey, chainCode, derivationStrategy, network } = useWalletStore()

  const syncPayload = useMemo(() => {
    if (!publicKey || !chainCode) return ""
    const data = {
      publicKey,
      chainCode,
      derivationStrategy,
      network,
    }
    return `POLYMEER_SYNC_V1:${JSON.stringify(data)}`
  }, [publicKey, chainCode, derivationStrategy, network])

  const magicLink = useMemo(() => {
    if (!syncPayload) return ""
    const url = new URL(window.location.origin)
    url.pathname = "/connect"
    url.searchParams.set("sync", syncPayload)
    return url.toString()
  }, [syncPayload])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const truncateMiddle = (str: string, start: number, end: number) => {
    if (str.length <= start + end) return str
    return `${str.substring(0, start)}...${str.substring(str.length - end)}`
  }

  if (!publicKey || !chainCode) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="bg-muted/10 hover:bg-muted/20 h-10 w-10 shrink-0 rounded-xl transition-all"
          title="Sync to Mobile"
        >
          <HugeiconsIcon icon={QrCode01Icon} size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background md:max-w-2xl rounded-[2rem] border-none p-8 shadow-2xl overflow-hidden">
        <DialogHeader className="space-y-2 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="bg-primary/10 mx-auto md:mx-0 flex h-14 w-14 items-center justify-center rounded-2xl">
              <HugeiconsIcon icon={QrCode01Icon} className="text-primary" size={28} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">Sync to Mobile</DialogTitle>
              <DialogDescription className="text-muted-foreground/70 text-xs font-medium leading-relaxed">
                Mirror your wallet on another device in{" "}
                <span className="text-foreground font-bold italic">Read-Only</span> mode.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-10">
          {/* Left Column: QR Code */}
          <div className="flex flex-col items-center justify-start space-y-4">
            <div className="relative flex h-64 w-64 items-center justify-center rounded-[2.5rem] bg-white p-6 shadow-sm shadow-black/5 ring-1 ring-black/[0.02]">
              <QRCodeSVG value={syncPayload} size={200} level="H" includeMargin={false} />
            </div>
            <p className="text-muted-foreground/40 text-[10px] font-bold tracking-widest uppercase md:hidden">
              Scan QR Code
            </p>
          </div>

          {/* Right Column: Info & Actions */}
          <div className="flex flex-col justify-start space-y-5">
            <div className="space-y-3">
              {/* Manual Sync Code */}
              <div className="bg-muted/10 border-border/50 flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors hover:bg-muted/15">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-muted-foreground text-[10px] font-black tracking-widest uppercase opacity-60">
                    Sync Code
                  </p>
                  <p className="text-foreground text-sm font-bold tabular-nums opacity-80 break-all">
                    {truncateMiddle(syncPayload, 20, 8)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(syncPayload, "Sync Code")}
                  className="h-10 w-10 shrink-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <HugeiconsIcon icon={Copy01Icon} size={18} />
                </Button>
              </div>

              {/* Magic Link */}
              <div className="bg-muted/10 border-border/50 flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors hover:bg-muted/15">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-muted-foreground text-[10px] font-black tracking-widest uppercase opacity-60">
                    Magic Link
                  </p>
                  <p className="text-foreground text-sm font-bold opacity-80 break-all line-clamp-2">
                    {magicLink}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(magicLink, "Magic Link")}
                  className="h-10 w-10 shrink-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <HugeiconsIcon icon={Link01Icon} size={18} />
                </Button>
              </div>
            </div>

            <div className="bg-rose-500/5 border-rose-500/10 rounded-2xl border p-4 md:p-5">
              <div className="flex items-center gap-2 mb-1.5 justify-center md:justify-start">
                <span className="text-rose-500 text-[10px] font-black tracking-wide uppercase opacity-80">
                  ⚠️ Privacy Warning
                </span>
              </div>
              <p className="text-muted-foreground/80 text-[10px] font-medium italic leading-relaxed text-center md:text-left">
                Anyone with this link or QR code can view your transaction history. Keep it strictly private.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <Button variant="outline" className="text-muted-foreground hover:bg-muted/10 h-12 w-full rounded-2xl border-border/50 text-[11px] font-black tracking-[0.2em] uppercase transition-colors" asChild>
             <DialogTrigger>Close Dialog</DialogTrigger>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
