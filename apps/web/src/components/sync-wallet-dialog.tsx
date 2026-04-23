import {
  Copy01Icon,
  Link01Icon,
  QrCode01Icon,
  SecurityPasswordIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  toast,
} from "@polymeer/ui"
import { QRCodeSVG } from "qrcode.react"
import { useCallback, useMemo, useState } from "react"

import type { SyncData } from "@/lib/crypto"
import { encryptJson } from "@/lib/crypto"
import { useConfigStore } from "@/stores/config.store"
import { useWalletStore } from "@/stores/wallet.store"

export function SyncWalletDialog() {
  const publicKey = useWalletStore((s) => s.publicKey)
  const chainCode = useWalletStore((s) => s.chainCode)
  const derivationStrategy = useWalletStore((s) => s.derivationStrategy)
  const network = useConfigStore((s) => s.network)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [encryptedPayload, setEncryptedPayload] = useState<string | null>(null)
  const [isEncrypting, setIsEncrypting] = useState(false)

  const handleGenerate = useCallback(async () => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    try {
      setIsEncrypting(true)
      const data: SyncData = {
        publicKey: publicKey!,
        chainCode: chainCode!,
        derivationStrategy,
        network,
      }
      const encrypted = await encryptJson(data, password)
      setEncryptedPayload(encrypted)
      toast.success("Sync code generated successfully")
    } catch (err) {
      console.error("Encryption failed:", err)
      toast.error("Failed to generate sync code")
    } finally {
      setIsEncrypting(false)
    }
  }, [password, publicKey, chainCode, derivationStrategy, network])

  const magicLink = useMemo(() => {
    if (!encryptedPayload) return ""
    const url = new URL(window.location.origin)
    url.pathname = "/connect"
    url.searchParams.set("sync", encryptedPayload)
    return url.toString()
  }, [encryptedPayload])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const truncateMiddle = (str: string, start: number, end: number) => {
    if (str.length <= start + end) return str
    return `${str.substring(0, start)}...${str.substring(str.length - end)}`
  }

  const handleReset = () => {
    setEncryptedPayload(null)
    setPassword("")
  }

  if (!publicKey || !chainCode) return null

  return (
    <Dialog onOpenChange={(open) => !open && handleReset()}>
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
      <DialogContent className="bg-background max-w-[90vw] overflow-hidden rounded-3xl border-none p-0 shadow-2xl sm:max-w-[560px]">
        {/* Centered Header */}
        <div className="bg-muted/5 border-border/10 flex flex-col items-center border-b p-6 text-center">
          <div className="bg-primary/10 mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
            <HugeiconsIcon icon={QrCode01Icon} className="text-primary" size={28} />
          </div>
          <DialogTitle className="text-lg font-bold">Sync to Mobile</DialogTitle>
          <DialogDescription className="text-muted-foreground/70 text-tiny mt-0.5 font-semibold uppercase">
            Mirror your wallet on another device in <span className="text-foreground font-bold italic">Read-Only</span>{" "}
            mode.
          </DialogDescription>
        </div>

        {/* Content Area */}
        <div className="flex flex-col gap-6 p-6 pt-4">
          {!encryptedPayload ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sync-password" title="Set a password to encrypt your wallet data" />
                  <div className="relative">
                    <div className="bg-muted/10 absolute top-1/2 left-4 -translate-y-1/2 rounded-lg p-1">
                      <HugeiconsIcon icon={SecurityPasswordIcon} size={16} className="text-muted-foreground" />
                    </div>
                    <Input
                      id="sync-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter at least 8 characters..."
                      className="bg-muted/5 border-border/40 focus:ring-primary/20 focus:border-primary/40 h-14 rounded-2xl pr-12 pl-12 text-sm font-medium transition-all outline-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground/60 hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 transition-colors"
                    >
                      <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} size={20} />
                    </button>
                  </div>
                  <p className="text-muted-foreground/50 px-2 text-[10px] font-medium italic">
                    This password is required on your second device to decrypt and import the wallet.
                  </p>
                </div>
              </div>

              <Button
                className="h-14 w-full rounded-2xl text-base font-bold shadow-none active:scale-[0.98]"
                onClick={handleGenerate}
                disabled={password.length < 8 || isEncrypting}
              >
                {isEncrypting ? "Encrypting..." : "Generate Sync Code"}
              </Button>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 grid grid-cols-1 gap-8 duration-500 md:grid-cols-[200px_1fr]">
              {/* Left Column: QR Code */}
              <div className="flex flex-col items-center justify-start space-y-3">
                <div className="relative flex h-52 w-52 items-center justify-center rounded-2xl bg-white p-4 shadow-sm ring-1 shadow-black/5 ring-black/[0.02]">
                  <QRCodeSVG value={magicLink} size={160} level="M" includeMargin={false} />
                </div>
                <p className="text-muted-foreground/40 text-[9px] font-bold uppercase">Scan QR Code</p>
              </div>

              {/* Right Column: Info & Actions */}
              <div className="flex flex-col justify-start space-y-4">
                <div className="space-y-2">
                  {/* Manual Sync Code */}
                  <div className="bg-muted/5 border-border/40 hover:bg-muted/10 flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-colors">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-muted-foreground text-[10px] font-bold uppercase opacity-60">Sync Code</p>
                      <p className="text-foreground text-sm font-bold break-all tabular-nums opacity-80">
                        {truncateMiddle(encryptedPayload, 20, 8)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(encryptedPayload, "Sync Code")}
                      className="hover:bg-primary/10 hover:text-primary h-10 w-10 shrink-0 rounded-xl transition-all"
                    >
                      <HugeiconsIcon icon={Copy01Icon} size={18} />
                    </Button>
                  </div>

                  {/* Magic Link */}
                  <div className="bg-muted/5 border-border/40 hover:bg-muted/10 flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-colors">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-muted-foreground text-[10px] font-bold uppercase opacity-60">Magic Link</p>
                      <p className="text-foreground line-clamp-1 text-sm font-bold break-all opacity-80">{magicLink}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(magicLink, "Magic Link")}
                      className="hover:bg-primary/10 hover:text-primary h-10 w-10 shrink-0 rounded-xl transition-all"
                    >
                      <HugeiconsIcon icon={Link01Icon} size={18} />
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[9px] font-bold text-rose-500 uppercase opacity-80">⚠️ Privacy Warning</span>
                  </div>
                  <p className="text-muted-foreground/80 text-[9px] leading-relaxed font-medium italic">
                    Anyone with this link or QR code can view your transaction history. Keep it strictly private.
                  </p>
                </div>

                <Button
                  variant="link"
                  className="text-primary hover:text-primary/80 h-auto p-0 text-[10px] font-bold uppercase"
                  onClick={handleReset}
                >
                  Change Password
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
