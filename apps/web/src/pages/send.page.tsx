import { fixedPointToString } from "@ckb-ccc/core"
import { ArrowLeft01Icon, Clock01Icon, QrCode01Icon, UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Skeleton,
  toast,
} from "@polymeer/ui"
import { useNavigate } from "@tanstack/react-router"
import { useCallback, useState } from "react"

import { QRCodeScanner } from "@/components/qr-scanner"
import { useAddress } from "@/hooks/use-address"
import { useBalance } from "@/hooks/use-balance"
import { useCkbWorker } from "@/hooks/use-ckb-worker"
import { formatAmount } from "@/lib/utils"
import { useSigningStore } from "@/stores/signing.store"
import { useWalletStore } from "@/stores/wallet.store"

export function SendPage() {
  const navigate = useNavigate()
  const worker = useCkbWorker()
  const { scriptsWithPaths, isLoading: isLoadingAddress } = useAddress()
  const { data: balance, isLoading: isBalanceLoading } = useBalance(scriptsWithPaths.map((s) => s.script))
  const openSigning = useSigningStore((s) => s.open)
  const isReadOnly = useWalletStore((s) => s.isReadOnly)

  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [feeRate, setFeeRate] = useState("1000")
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [step, setStep] = useState<"input" | "review">("input")
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null)

  const handleMaxAmount = useCallback(() => {
    if (balance) {
      setAmount(fixedPointToString(balance))
    }
  }, [balance])

  const onScanSuccess = useCallback((decodedText: string) => {
    setRecipient(decodedText)
    setIsScannerOpen(false)
  }, [])

  const handleReview = async () => {
    if (!recipient || !amount) return
    const amountNum = Number(amount)
    if (isNaN(amountNum) || amountNum < 61) {
      toast.error("Minimum transfer amount is 61 CKB")
      return
    }

    try {
      const res = await worker.buildSendCkb(scriptsWithPaths, recipient, amount, feeRate)
      setEstimatedFee(res.fee)
      setStep("review")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to estimate fee")
    }
  }

  const handleConfirm = () => {
    openSigning({
      type: "transfer",
      payload: { recipient, amount, feeRate },
    })
  }

  const onBack = () => {
    if (step === "review") {
      setStep("input")
    } else {
      navigate({ to: "/" })
    }
  }

  if (isLoadingAddress) {
    return (
      <div className="w-full max-w-lg py-20">
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-2xl duration-700">
      <Card className="border-border/50 bg-muted/10 overflow-hidden rounded-3xl border shadow-none">
        <CardHeader className="border-border/50 border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl transition-all" onClick={onBack}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </Button>
            <CardTitle className="text-foreground text-lg font-bold">Send Assets</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {step === "input" && (
            <div className="animate-in fade-in space-y-6 duration-300">
              {/* Recipient Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-muted-foreground/70 text-[10px] font-bold tracking-[0.2em] uppercase">
                    Recipient
                  </span>
                  <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary h-auto p-0 text-[10px] font-black tracking-wider uppercase hover:bg-transparent"
                      >
                        <HugeiconsIcon icon={QrCode01Icon} size={12} className="mr-1.5" />
                        Scan QR
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-background max-w-[400px] rounded-3xl border-none p-6 shadow-2xl">
                      <DialogHeader className="pb-4">
                        <DialogTitle className="text-center text-lg font-bold">Scan QR Code</DialogTitle>
                      </DialogHeader>
                      <QRCodeScanner onScanSuccess={onScanSuccess} />
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="bg-muted/10 border-border/50 relative flex items-center rounded-xl border px-1">
                  <Input
                    id="recipient"
                    placeholder="Enter CKB address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="h-12 border-none bg-transparent text-sm font-medium shadow-none focus-visible:ring-0"
                  />
                  <div className="text-muted-foreground/50 pr-3">
                    <HugeiconsIcon icon={UserIcon} size={16} />
                  </div>
                </div>
              </div>

              {/* Amount & Fee Rate Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Amount Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-muted-foreground/70 text-[10px] font-bold tracking-[0.2em] uppercase">
                      Amount
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground/60 text-[10px] font-bold tracking-tighter uppercase">
                        Bal: {isBalanceLoading ? "..." : balance ? formatAmount(balance) : "0.00"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary h-auto p-0 text-[10px] font-black tracking-wider uppercase hover:bg-transparent"
                        onClick={handleMaxAmount}
                      >
                        Max
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted/10 border-border/50 relative flex items-center rounded-xl border p-1">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Minimum 61 CKB"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 border-none bg-transparent text-sm font-medium shadow-none focus-visible:ring-0"
                    />
                    <span className="text-muted-foreground/50 pr-4 text-[10px] font-black uppercase">CKB</span>
                  </div>
                </div>

                {/* Fee Rate Input */}
                <div className="space-y-2">
                  <label className="text-muted-foreground/70 px-1 text-[10px] font-bold tracking-[0.2em] uppercase">
                    Fee Rate (shannons/kB)
                  </label>
                  <div className="bg-muted/10 border-border/50 relative flex items-center rounded-xl border p-1">
                    <Input
                      type="number"
                      value={feeRate}
                      onChange={(e) => setFeeRate(e.target.value)}
                      className="h-12 border-none bg-transparent text-sm font-medium shadow-none focus-visible:ring-0"
                    />
                    <div className="text-muted-foreground/40 pr-4">
                      <HugeiconsIcon icon={Clock01Icon} size={16} />
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="mt-6 h-14 w-full rounded-2xl text-base font-bold tracking-tight shadow-none transition-all active:scale-[0.98]"
                disabled={!recipient || !amount || isBalanceLoading || isReadOnly}
                onClick={handleReview}
              >
                {isReadOnly ? "View-Only Mode" : "Review Transaction"}
              </Button>
            </div>
          )}

          {step === "review" && (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
              <div className="bg-muted/15 border-border/50 space-y-5 rounded-2xl border p-5">
                <div className="space-y-1">
                  <span className="text-muted-foreground/60 text-[10px] font-bold tracking-[0.2em] uppercase">
                    Recipient
                  </span>
                  <p className="text-foreground text-[13px] leading-relaxed font-bold break-all opacity-90">
                    {recipient}
                  </p>
                </div>
                <div className="border-border/20 flex items-center justify-between border-t pt-4">
                  <span className="text-muted-foreground/60 text-[10px] font-bold tracking-[0.2em] uppercase">
                    Amount
                  </span>
                  <span className="text-foreground text-xl font-black tracking-tight">
                    {amount} <span className="text-xs font-bold opacity-60">CKB</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground/60 text-[10px] font-bold tracking-[0.2em] uppercase">
                    Network Fee
                  </span>
                  <span className="text-muted-foreground/80 text-sm font-semibold tabular-nums">
                    {estimatedFee ? formatAmount(BigInt(estimatedFee)) : "..."} CKB
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  className="h-14 w-full rounded-2xl text-base font-bold tracking-tight shadow-none transition-all active:scale-[0.98]"
                  onClick={handleConfirm}
                >
                  Confirm & Sign
                </Button>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground h-10 w-full rounded-xl text-xs font-bold tracking-widest uppercase transition-colors"
                  onClick={() => setStep("input")}
                >
                  Go Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
