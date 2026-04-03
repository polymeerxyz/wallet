import { QrCode01Icon, SmartPhone01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  RadioGroup,
  RadioGroupItem,
  Spinner,
  toast,
} from "@polymeer/ui"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import LedgerSVG from "@/assets/svgs/ledger.svg?react"
import { QRCodeScanner } from "@/components/qr-scanner"
import { useLedgerDevice } from "@/hooks/use-ledger-device"
import { useWalletStore, WalletDerivationStrategy } from "@/stores/wallet.store"

export function ConnectPage() {
  const { connect, loading } = useLedgerDevice()
  const [error, setError] = useState<string | null>(null)
  const [derivationStrategy, setDerivationStrategy] = useState<WalletDerivationStrategy>(
    WalletDerivationStrategy.ACCOUNT_BASED
  )
  const setWallet = useWalletStore((state) => state.setWallet)
  const navigate = useNavigate()
  const search = useSearch({ from: "/connect" })
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [manualCode, setManualCode] = useState("")

  const handleSync = (payload: string) => {
    if (!payload.startsWith("POLYMEER_SYNC_V1:")) {
      toast.error("Invalid sync code format")
      return
    }

    try {
      const jsonStr = payload.replace("POLYMEER_SYNC_V1:", "")
      const data = JSON.parse(jsonStr)

      setWallet({
        publicKey: data.publicKey,
        chainCode: data.chainCode,
        derivationStrategy: data.derivationStrategy,
        isReadOnly: true,
      })

      // Update network if it's different
      useWalletStore.getState().setNetwork(data.network)

      toast.success("Wallet synchronized successfully!")
      navigate({ to: "/" })
    } catch (err) {
      console.error("Sync error:", err)
      toast.error("Failed to parse sync data")
    }
  }

  useEffect(() => {
    if (search.sync) {
      handleSync(search.sync)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.sync])

  const connectLedger = async () => {
    setError(null)
    const ledger = await connect()

    if (!ledger) return

    try {
      const { publicKey: rawPublicKey, chainCode } = await ledger.getWalletExtendedPublicKey("m/44'/309'/0'")

      if (rawPublicKey) {
        setWallet({
          publicKey: rawPublicKey,
          chainCode,
          derivationStrategy,
        })

        console.log(`Connected with strategy:`, derivationStrategy)
        navigate({ to: "/" })
      } else {
        setError("Failed to retrieve address from Ledger.")
      }
    } catch (err: unknown) {
      console.error("Ledger retrieval error:", err)
      setError(err instanceof Error ? err.message : "An error occurred while retrieving address.")
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-sm duration-700">
      <Card className="border-border/50 bg-muted/10 rounded-3xl border py-4 shadow-none">
        <CardHeader className="pt-4 pb-6 text-center">
          <div className="bg-muted/10 border-border/50 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border">
            <LedgerSVG className="text-primary h-8 w-8 opacity-80" />
          </div>
          <CardTitle className="text-foreground text-xl font-bold">Connect Wallet</CardTitle>
          <CardDescription className="text-muted-foreground/70 text-[11px] font-bold tracking-wider uppercase">
            Access your Nervos CKB Assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="text-muted-foreground/60 text-[9px] font-bold tracking-[0.2em] uppercase">
                Derivation Strategy
              </span>
            </div>
            <RadioGroup
              value={derivationStrategy}
              onValueChange={(value) => setDerivationStrategy(value as WalletDerivationStrategy)}
              className="grid gap-2"
            >
              {[
                {
                  value: WalletDerivationStrategy.ACCOUNT_BASED,
                  label: "Neuron Compatible",
                  desc: "Recommended for desktop users",
                },
                {
                  value: WalletDerivationStrategy.UTXO_BASED,
                  label: "Standard BIP-44",
                  desc: "Enhanced privacy and security",
                },
                {
                  value: WalletDerivationStrategy.SINGLE_ADDRESS,
                  label: "Fixed Address",
                  desc: "Simplified one-address mode",
                },
              ].map((item) => (
                <Label
                  key={item.value}
                  className={cn(
                    "group border-border/20 hover:bg-muted/10 flex cursor-pointer flex-col gap-0.5 rounded-xl border p-3.5 transition-all",
                    derivationStrategy === item.value
                      ? "bg-muted/20 border-primary/30 ring-primary/10 ring-1"
                      : "bg-muted/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold opacity-80">{item.label}</span>
                    <RadioGroupItem value={item.value} className="sr-only" />
                  </div>
                  <span className="text-muted-foreground/70 text-[10px] leading-none font-medium">{item.desc}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4 pt-2">
            <Button
              onClick={connectLedger}
              disabled={loading}
              className="h-14 w-full rounded-2xl text-base font-bold tracking-tight shadow-none transition-all active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Spinner className="h-5 w-5" />
                  <span className="text-sm">Connecting...</span>
                </div>
              ) : (
                "Connect Ledger"
              )}
            </Button>

            {error && (
              <div className="bg-destructive/10 border-destructive/20 rounded-xl border p-3 text-center">
                <p className="text-destructive text-[11px] font-bold opacity-80">{error}</p>
              </div>
            )}

            <p className="text-muted-foreground/50 px-4 text-center text-[10px] leading-relaxed font-medium italic">
              Ensure your Ledger is unlocked and the CKB app is active.
            </p>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="border-border/40 w-full border-t" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="text-muted-foreground/40 bg-background px-3 font-black tracking-widest">Or</span>
              </div>
            </div>

            <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="bg-muted/5 hover:bg-muted/10 border-border/20 h-14 w-full rounded-2xl border text-sm font-bold shadow-none transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <HugeiconsIcon icon={SmartPhone01Icon} size={20} className="text-primary/70" />
                    <span>Sync from another device</span>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background max-w-[420px] rounded-[2rem] border-none p-8 shadow-2xl">
                <DialogHeader className="space-y-3 text-center">
                  <div className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
                    <HugeiconsIcon icon={QrCode01Icon} className="text-primary" size={32} />
                  </div>
                  <DialogTitle className="text-2xl font-black tracking-tight">Sync Wallet</DialogTitle>
                </DialogHeader>

                <div className="mt-6 space-y-6">
                  <div className="border-border/50 bg-muted/10 overflow-hidden rounded-2xl border">
                    <QRCodeScanner
                      onScanSuccess={(text) => {
                        setIsScannerOpen(false)
                        handleSync(text)
                      }}
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="border-border/30 w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-[9px] uppercase">
                      <span className="bg-background text-muted-foreground/40 px-4 font-black tracking-widest">
                        Or paste code
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Paste your sync code here..."
                      className="bg-muted/10 border-border/50 focus:ring-primary/20 h-24 w-full resize-none rounded-2xl border p-4 text-xs font-medium focus:ring-1 focus:outline-none"
                    />
                    <Button
                      className="h-12 w-full rounded-xl text-xs font-black tracking-widest uppercase"
                      onClick={() => handleSync(manualCode)}
                      disabled={!manualCode.trim()}
                    >
                      Import Wallet
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
