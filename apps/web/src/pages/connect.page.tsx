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
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import LedgerSVG from "@/assets/svgs/ledger.svg?react"
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
    <div className="animate-in fade-in slide-in-from-bottom-2 w-full max-w-[420px] duration-500">
      <Card className="border-border bg-card/30 rounded-[32px] py-6 shadow-none border">
        <CardHeader className="pt-6 pb-8 text-center">
          <div className="bg-muted/20 border-border mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[24px] border">
            <LedgerSVG className="text-primary h-10 w-10" />
          </div>
          <CardTitle className="text-foreground text-2xl font-black">Connect Wallet</CardTitle>
          <CardDescription className="text-muted-foreground/60 text-sm font-medium">
            Open the CKB app on your hardware device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 px-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="text-muted-foreground/40 text-[10px] font-black tracking-[0.2em] uppercase">
                Derivation Strategy
              </span>
            </div>
            <RadioGroup
              value={derivationStrategy}
              onValueChange={(value) => setDerivationStrategy(value as WalletDerivationStrategy)}
              className="grid gap-3"
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
                      "border-border hover:bg-muted/30 flex cursor-pointer flex-col gap-1 rounded-[20px] border p-4 transition-all",
                      derivationStrategy === item.value
                        ? "bg-muted/50 border-primary/50 ring-primary/20 ring-1"
                        : "bg-muted/5"
                    )}
                  >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{item.label}</span>
                    <RadioGroupItem value={item.value} className="sr-only" />
                  </div>
                  <span className="text-muted-foreground/60 text-[11px] font-medium">{item.desc}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Button
              onClick={connectLedger}
              disabled={loading}
              className="bg-primary text-secondary h-14 w-full rounded-[20px] border-none text-base font-black tracking-tight shadow-none transition-all hover:opacity-90 active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Spinner className="h-5 w-5" />
                  <span>Connecting...</span>
                </div>
              ) : (
                "Connect Ledger"
              )}
            </Button>

            {error && (
              <div className="bg-destructive/10 border-destructive/30 rounded-2xl border p-4 text-center">
                <p className="text-destructive text-xs font-bold">{error}</p>
              </div>
            )}

            <p className="text-muted-foreground/40 px-2 text-center text-[11px] font-medium italic">
              Make sure your Ledger is unlocked and the CKB app is ready.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
