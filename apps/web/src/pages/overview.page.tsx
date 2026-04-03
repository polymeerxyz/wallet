import { fixedPointToString } from "@ckb-ccc/core"
import { ArrowLeftRightIcon, Copy01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Skeleton,
} from "@polymeer/ui"
import { Link, useNavigate } from "@tanstack/react-router"
import { QRCodeSVG } from "qrcode.react"

import { useAddress } from "@/hooks/use-address"
import { useBalance } from "@/hooks/use-balance"
import { useWalletStore } from "@/stores/wallet.store"

export function OverviewPage() {
  const { address, scripts, isLoading: isLoadingAddress } = useAddress()
  const clearWallet = useWalletStore((state) => state.clearWallet)
  const navigate = useNavigate()

  const { data: balance, isLoading: isBalanceLoading } = useBalance(scripts)

  const disconnect = () => {
    clearWallet()
    navigate({ to: "/connect" })
  }

  const formatAmount = (amount: bigint) => {
    return Number(fixedPointToString(amount)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    })
  }

  const truncateAddress = (addr: string) => {
    if (addr.length <= 27) return addr
    return `${addr.slice(0, 12)}...${addr.slice(-12)}`
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
    }
  }

  if (isLoadingAddress) {
    return (
      <div className="w-full max-w-4xl py-20">
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 w-full max-w-lg space-y-12 py-10 duration-500">
      {/* Balance Section */}
      <section className="flex flex-col items-center justify-center space-y-4 text-center">
        <span className="text-muted-foreground text-sm font-bold tracking-widest uppercase">Balance</span>
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-2">
            <h1 className="text-foreground text-6xl font-black tracking-tight tabular-nums">
              {isBalanceLoading ? "---" : balance ? formatAmount(balance) : "0.00"}
            </h1>
            <span className="text-muted-foreground/60 text-2xl font-black tracking-tighter uppercase">CKB</span>
          </div>
          <p className="text-muted-foreground/30 text-lg font-medium">≈ $0.00</p>
        </div>
      </section>

      {/* Main Actions */}
      <section className="grid grid-cols-2 gap-4">
        <Link to="/send" className="w-full">
          <Button className="bg-primary text-secondary hover:bg-primary/90 h-14 w-full rounded-[20px] border-none text-base font-bold tracking-tight shadow-none transition-all active:scale-[0.98]">
            Send
          </Button>
        </Link>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              className="bg-muted/40 hover:bg-muted/60 text-foreground h-14 w-full rounded-[20px] border-none text-base font-bold shadow-none transition-all active:scale-[0.98]"
            >
              Receive
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-background max-w-[400px] rounded-[32px] p-8 shadow-none border">
            <DialogHeader className="space-y-3 border-none pb-6">
              <DialogTitle className="text-center text-2xl font-black">Receive Assets</DialogTitle>
              <DialogDescription className="text-muted-foreground text-center text-sm font-medium">
                Scan QR or copy address
              </DialogDescription>
            </DialogHeader>
            <div className="flex w-full flex-col items-center justify-center gap-8">
              <div className="border border-border/50 rounded-[28px] bg-white p-6 shadow-inner flex items-center justify-center">
                {address && <QRCodeSVG value={address} size={200} level="H" />}
              </div>
              <div className="w-full space-y-2">
                <div className="bg-muted/30 border-border flex items-center gap-2 rounded-2xl border p-4">
                  <p className="text-foreground flex-1 truncate text-sm font-bold">{truncateAddress(address || "")}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={copyAddress}
                    className="hover:bg-background h-10 w-10 rounded-xl transition-all"
                  >
                    <HugeiconsIcon icon={Copy01Icon} size={18} />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </section>

      {/* Info Sections */}
      <section className="space-y-4">
        <Link to="/transactions" className="block">
          <div className="border-border bg-card/10 hover:bg-muted/10 group flex items-center justify-between rounded-[28px] border p-6 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-muted/20 rounded-2xl p-3">
                <HugeiconsIcon icon={ArrowLeftRightIcon} size={20} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-foreground font-sans text-base font-bold">Transaction History</p>
                <p className="text-muted-foreground/60 text-xs font-medium">View all your activities</p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ArrowLeftRightIcon}
              size={18}
              className="text-muted-foreground rotate-180 opacity-50 transition-transform group-hover:translate-x-1"
            />
          </div>
        </Link>
        <div className="border-border bg-card/10 space-y-6 rounded-[28px] border p-6">
          <div className="flex items-center gap-2 px-1">
            <HugeiconsIcon icon={Copy01Icon} size={16} className="text-muted-foreground opacity-50" />
            <span className="text-muted-foreground/40 text-[10px] font-black tracking-[0.2em] uppercase">
              Manage Session
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="bg-muted/20 border-border flex items-center justify-between rounded-2xl border p-4">
              <code className="text-foreground/70 mr-4 truncate text-[13px] font-bold tracking-tight">
                {address || ""}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-background h-8 w-8 rounded-lg p-0"
                onClick={copyAddress}
              >
                <HugeiconsIcon icon={Copy01Icon} size={14} className="opacity-50" />
              </Button>
            </div>
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 mt-2 h-12 w-full rounded-2xl font-bold transition-colors"
              onClick={disconnect}
            >
              Disconnect Wallet
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
