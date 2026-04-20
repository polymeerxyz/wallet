import { QrCode01Icon, SecurityPasswordIcon, SmartPhone01Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons"
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
import { useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useState } from "react"

import type { SyncData } from "@/lib/crypto"
import { decryptJson } from "@/lib/crypto"
import { useWalletStore } from "@/stores/wallet.store"

interface ImportWalletDialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialCode?: string
}

export function ImportWalletDialog({ children, open, onOpenChange, initialCode }: ImportWalletDialogProps) {
  const navigate = useNavigate()
  const setWallet = useWalletStore((state) => state.setWallet)
  const [step, setStep] = useState<"input" | "decrypt">("input")
  const [syncCode, setSyncCode] = useState(initialCode || "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)

  // Handle initial code and parameter changes
  useEffect(() => {
    if (initialCode) {
      setSyncCode(initialCode)
      setStep("decrypt")
    }
  }, [initialCode])

  const handleSyncCode = useCallback((code: string) => {
    setSyncCode(code)
    setStep("decrypt")
  }, [])

  const handleDecrypt = useCallback(async () => {
    if (!password) {
      toast.error("Please enter the encryption password")
      return
    }

    try {
      setIsDecrypting(true)
      const data = (await decryptJson(syncCode, password)) as SyncData

      setWallet({
        publicKey: data.publicKey,
        chainCode: data.chainCode,
        derivationStrategy: data.derivationStrategy,
        isReadOnly: true,
      })

      // Update network if it's different
      useWalletStore.getState().setNetwork(data.network)

      toast.success("Wallet synchronized successfully!")
      onOpenChange?.(false)
      navigate({ to: "/" })
    } catch (err) {
      console.error("Decryption failed:", err)
      toast.error(err instanceof Error ? err.message : "Failed to decrypt sync code")
    } finally {
      setIsDecrypting(false)
    }
  }, [syncCode, password, setWallet, onOpenChange, navigate])

  const handleReset = () => {
    setStep("input")
    setSyncCode("")
    setPassword("")
    setIsDecrypting(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange?.(val)
        if (!val) handleReset()
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            className="bg-muted/5 hover:bg-muted/10 border-border/20 h-14 w-full rounded-2xl border text-sm font-bold shadow-none transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={SmartPhone01Icon} size={20} className="text-primary/70" />
              <span>Sync from another device</span>
            </div>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-background max-w-[90vw] overflow-hidden rounded-3xl border-none p-0 shadow-2xl sm:max-w-[400px]">
        {/* Centered Header with Icon */}
        <div className="bg-muted/5 border-border/10 flex flex-col items-center border-b p-6 text-center">
          <div className="bg-primary/10 mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
            <HugeiconsIcon icon={QrCode01Icon} className="text-primary" size={28} />
          </div>
          <DialogTitle className="text-lg font-bold">Sync Wallet</DialogTitle>
          <DialogDescription className="text-muted-foreground/70 text-tiny mt-0.5 font-semibold uppercase">
            {step === "input" ? "Paste your sync code" : "Enter password to decrypt"}
          </DialogDescription>
        </div>

        <div className="p-6 pb-8">
          {step === "input" ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500">
              <div className="space-y-4">
                <textarea
                  value={syncCode}
                  onChange={(e) => setSyncCode(e.target.value)}
                  placeholder="Paste your sync code here..."
                  className="bg-muted/5 border-border/40 focus:ring-primary/20 h-24 w-full resize-none rounded-2xl border p-4 text-xs font-medium focus:ring-1 focus:outline-none"
                  autoFocus
                />
                <Button
                  className="h-12 w-full rounded-xl text-xs font-bold uppercase transition-all active:scale-[0.98]"
                  onClick={() => handleSyncCode(syncCode)}
                  disabled={!syncCode.trim()}
                >
                  Confirm Code
                </Button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="import-password" title="Encryption Password" />
                  <div className="relative">
                    <div className="bg-muted/10 absolute top-1/2 left-4 -translate-y-1/2 rounded-lg p-1">
                      <HugeiconsIcon icon={SecurityPasswordIcon} size={16} className="text-muted-foreground" />
                    </div>
                    <Input
                      id="import-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter the sync password..."
                      className="bg-muted/5 border-border/40 focus:ring-primary/20 focus:border-primary/40 h-12 rounded-2xl pr-12 pl-12 text-sm font-medium transition-all outline-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleDecrypt()}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground/60 hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 transition-colors"
                    >
                      <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  className="h-12 w-full rounded-2xl text-base font-bold shadow-none active:scale-[0.98]"
                  onClick={handleDecrypt}
                  disabled={!password || isDecrypting}
                >
                  {isDecrypting ? "Decrypting..." : "Sync Wallet"}
                </Button>
                <Button
                  variant="ghost"
                  className="text-muted-foreground/60 hover:text-foreground text-tiny h-12 w-full rounded-2xl font-semibold uppercase transition-colors"
                  onClick={() => setStep("input")}
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
