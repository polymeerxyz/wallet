import { fixedPointToString } from "@ckb-ccc/core"
import { ArrowLeft01Icon, QrCode01Icon, Settings03Icon, UserIcon } from "@hugeicons/core-free-icons"
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
} from "@polymeer/ui"
import { Link, useNavigate } from "@tanstack/react-router"
import { useCallback, useState } from "react"

import { QRCodeScanner } from "@/components/qr-scanner"
import { useAddress } from "@/hooks/use-address"
import { useBalance } from "@/hooks/use-balance"
import { useSendCKB } from "@/hooks/use-send-ckb"

export function SendPage() {
  const { scripts, isLoading: isLoadingAddress } = useAddress()
  const { data: balance, isLoading: isBalanceLoading } = useBalance(scripts)
  const { send, estimateFee, loading: isSending } = useSendCKB()
  const navigate = useNavigate()

  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [step, setStep] = useState<"input" | "review" | "signing">("input")
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null)

  const formatAmount = (val: bigint) => {
    return Number(fixedPointToString(val)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    })
  }

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
    try {
      const fee = await estimateFee(recipient, amount)
      setEstimatedFee(fee)
      setStep("review")
    } catch (err) {
      // Error is handled in hook toast
    }
  }

  const handleConfirm = async () => {
    setStep("signing")
    try {
      const hash = await send(recipient, amount)
      if (hash) {
        navigate({ to: "/" })
      }
    } catch (err) {
      setStep("review")
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
    <div className="animate-in fade-in slide-in-from-bottom-2 w-full max-w-[480px] duration-500">
      <Card className="border-border bg-card/30 rounded-[32px] border shadow-none">
        <CardHeader className="border-border border-b px-8 py-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="hover:bg-muted/50 h-10 w-10 rounded-xl p-0 transition-all">
                <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
              </Button>
            </Link>
            <CardTitle className="text-foreground text-xl font-black">Send Assets</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {step === "input" && (
            <div className="animate-in fade-in space-y-8 duration-300">
              {/* Recipient Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-muted-foreground/40 text-[10px] font-black tracking-[0.2em] uppercase">
                    Recipient
                  </span>
                  <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary h-6 gap-2 p-0 text-[10px] font-black tracking-wider uppercase hover:bg-transparent hover:opacity-70"
                      >
                        <HugeiconsIcon icon={QrCode01Icon} size={12} />
                        Scan QR
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-border bg-background max-w-[400px] rounded-[32px] border p-8 shadow-none">
                      <DialogHeader className="pb-4">
                        <DialogTitle className="text-center text-xl font-black">Scan QR Code</DialogTitle>
                      </DialogHeader>
                      <QRCodeScanner onScanSuccess={onScanSuccess} />
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative">
                  <Input
                    id="recipient"
                    placeholder="Enter CKB address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="border-border bg-muted/20 focus-visible:ring-primary/10 h-14 rounded-2xl pr-12 pl-4 text-sm font-bold shadow-none"
                  />
                  <div className="text-muted-foreground/30 absolute top-1/2 right-4 -translate-y-1/2">
                    <HugeiconsIcon icon={UserIcon} size={18} />
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-muted-foreground/40 text-[10px] font-black tracking-[0.2em] uppercase">
                    Amount
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground/30 text-[10px] font-black tracking-tighter uppercase">
                      Bal: {isBalanceLoading ? "..." : balance ? formatAmount(balance) : "0.00"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary h-4 p-0 text-[10px] font-black tracking-wider uppercase hover:bg-transparent hover:opacity-70"
                      onClick={handleMaxAmount}
                    >
                      Max
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/10 border-border relative flex flex-col items-center rounded-2xl border py-4">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="placeholder:text-muted-foreground/10 h-20 w-full rounded-none border-none bg-transparent text-center text-5xl font-black shadow-none focus-visible:ring-0"
                  />
                  <span className="text-muted-foreground/40 mt-2 text-xs font-black tracking-widest uppercase">
                    CKB
                  </span>
                </div>
              </div>

              <Button
                className="bg-primary text-secondary mt-4 h-14 w-full rounded-[20px] border-none text-base font-black tracking-tight shadow-none transition-all hover:opacity-90 active:scale-[0.98]"
                disabled={!recipient || !amount || isBalanceLoading}
                onClick={handleReview}
              >
                Review
              </Button>
            </div>
          )}

          {step === "review" && (
            <div className="animate-in fade-in slide-in-from-right-2 space-y-8 duration-300">
              <div className="border-border bg-muted/10 space-y-6 rounded-[24px] border p-6">
                <div className="space-y-1">
                  <span className="text-muted-foreground/30 text-[10px] font-black tracking-[0.2em] uppercase">
                    Recipient
                  </span>
                  <p className="text-foreground text-sm leading-relaxed font-bold break-all">{recipient}</p>
                </div>
                <div className="border-border flex items-center justify-between border-y py-4">
                  <span className="text-muted-foreground/30 text-[10px] font-black tracking-[0.2em] uppercase">
                    Amount
                  </span>
                  <span className="text-foreground text-2xl font-black">{amount} CKB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground/30 text-[10px] font-black tracking-[0.2em] uppercase">
                    Network Fee
                  </span>
                  <span className="text-muted-foreground text-sm font-bold">
                    {estimatedFee ? formatAmount(BigInt(estimatedFee)) : "..."} CKB
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  className="bg-primary text-secondary h-14 w-full rounded-[20px] border-none text-base font-black tracking-tight shadow-none transition-all hover:opacity-90 active:scale-[0.98]"
                  onClick={handleConfirm}
                  disabled={isSending}
                >
                  {isSending ? "Building..." : "Confirm Send"}
                </Button>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground h-12 w-full rounded-[20px] font-bold transition-colors"
                  onClick={() => setStep("input")}
                >
                  Go Back
                </Button>
              </div>
            </div>
          )}

          {step === "signing" && (
            <div className="animate-in zoom-in-95 flex flex-col items-center justify-center space-y-8 py-16 text-center duration-500">
              <div className="relative">
                <div className="bg-muted/20 border-border relative flex h-24 w-24 items-center justify-center rounded-[32px] border">
                  <HugeiconsIcon icon={Settings03Icon} size={40} className="text-primary animate-spin" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-foreground text-2xl font-black tracking-tight">Sign on Ledger</h3>
                <p className="text-muted-foreground/60 px-4 text-sm leading-relaxed font-medium">
                  Confirm the transaction details on your hardware device to proceed.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
