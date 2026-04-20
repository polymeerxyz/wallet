import { SmartPhone01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Label,
  RadioGroup,
  RadioGroupItem,
  Spinner,
} from "@polymeer/ui"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import LedgerSVG from "@/assets/svgs/ledger.svg?react"
import { ImportWalletDialog } from "@/components/import-wallet-dialog"
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

  const [isImportOpen, setIsImportOpen] = useState(false)
  const [initialSyncCode, setInitialSyncCode] = useState("")

  useEffect(() => {
    if (search.sync) {
      setInitialSyncCode(search.sync)
      setIsImportOpen(true)
    }
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
      <Card className="border-border/50 bg-muted/10 rounded-3xl border shadow-none">
        <CardHeader className="pt-6 pb-4 text-center">
          <div className="bg-muted/10 border-border/50 mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border">
            <LedgerSVG className="text-primary h-7 w-7 opacity-80" />
          </div>
          <CardTitle className="text-foreground text-lg font-bold">Connect Wallet</CardTitle>
          <CardDescription className="text-muted-foreground/70 text-[10px] font-bold uppercase">
            Access your Nervos CKB Assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="text-muted-foreground/60 text-[9px] font-bold uppercase">Derivation Strategy</span>
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

          <div className="space-y-3 pt-1">
            <Button
              onClick={connectLedger}
              disabled={loading}
              className="h-12 w-full rounded-2xl text-base font-bold shadow-none transition-all active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
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
                <span className="text-muted-foreground/40 bg-background px-3 font-bold">Or</span>
              </div>
            </div>

            <ImportWalletDialog open={isImportOpen} onOpenChange={setIsImportOpen} initialCode={initialSyncCode}>
              <Button
                variant="ghost"
                className="bg-muted/5 hover:bg-muted/10 border-border/20 h-14 w-full rounded-2xl border text-sm font-bold shadow-none transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <HugeiconsIcon icon={SmartPhone01Icon} size={20} className="text-primary/70" />
                  <span>Sync from another device</span>
                </div>
              </Button>
            </ImportWalletDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
