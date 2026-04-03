import { ArrowLeftRightIcon, Copy01Icon, SafeIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, Skeleton } from "@polymeer/ui"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"

import { useAddress } from "@/hooks/use-address"
import { useBalance } from "@/hooks/use-balance"
import { formatAmount } from "@/lib/utils"
import { useWalletStore } from "@/stores/wallet.store"

import { ReceiveDialog } from "../components/receive-dialog"
import { SyncWalletDialog } from "../components/sync-wallet-dialog"

export function OverviewPage() {
  const queryClient = useQueryClient()
  const { address, scripts, isLoading: isLoadingAddress } = useAddress()

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["ckb-balance"] })
  }, [queryClient])

  const clearWallet = useWalletStore((state) => state.clearWallet)
  const isReadOnly = useWalletStore((state) => state.isReadOnly)
  const navigate = useNavigate()

  const { data: balance, isLoading: isBalanceLoading } = useBalance(scripts)

  const disconnect = () => {
    clearWallet()
    navigate({
      to: "/connect",
      search: {
        sync: undefined,
        redirect: undefined,
      },
    })
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
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-md space-y-8 py-4 duration-700">
      {/* Overview Card */}
      <section className="bg-muted/10 border-border/50 relative overflow-hidden rounded-[2rem] border px-6 pt-8 pb-6 text-center shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-3">
          <span className="text-muted-foreground/70 text-[10px] font-black tracking-[0.2em] uppercase">
            Total Balance
          </span>
          <div className="flex w-full min-w-0 items-baseline justify-center gap-2 px-2">
            <h1
              className="text-foreground text-center text-3xl font-black tracking-tight tabular-nums sm:text-4xl"
              title={balance ? formatAmount(balance) : "0"}
            >
              {isBalanceLoading ? "---" : balance ? formatAmount(balance) : "0.00"}
            </h1>
            <span className="text-muted-foreground/50 shrink-0 text-xl font-bold tracking-tighter uppercase sm:text-2xl">
              CKB
            </span>
          </div>
          <p className="text-muted-foreground/40 text-[13px] font-medium">≈ $0.00</p>
        </div>

        {/* Actions */}
        <div className="border-border/30 mt-8 grid grid-cols-2 gap-3 border-t pt-6">
          <Link to="/send" className="w-full">
            <Button className="h-12 w-full rounded-2xl text-sm font-bold tracking-tight transition-all active:scale-[0.98]">
              Send
            </Button>
          </Link>
          <ReceiveDialog address={address ?? ""}>
            <Button
              variant="secondary"
              className="h-12 w-full rounded-2xl text-sm font-bold transition-all active:scale-[0.98]"
            >
              Receive
            </Button>
          </ReceiveDialog>
        </div>
      </section>

      {/* Info Sections */}
      <section className="space-y-3">
        <Link to="/transactions" className="block">
          <div className="border-border bg-muted/10 hover:bg-muted/15 group flex items-center justify-between rounded-2xl border p-5 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-muted/20 flex h-10 w-10 items-center justify-center rounded-xl p-2.5">
                <HugeiconsIcon icon={ArrowLeftRightIcon} size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-foreground text-sm font-bold">Activity</p>
                <p className="text-muted-foreground/60 text-[10px] font-semibold tracking-wider uppercase">
                  History & Status
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ArrowLeftRightIcon}
              size={14}
              className="text-muted-foreground/60 rotate-180 transition-transform group-hover:translate-x-1"
            />
          </div>
        </Link>
        <Link to="/dao" className="block">
          <div className="border-border bg-primary/5 hover:bg-primary/10 group flex items-center justify-between rounded-2xl border p-5 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl p-2.5">
                <HugeiconsIcon icon={SafeIcon} size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-foreground text-sm font-bold">Nervos DAO</p>
                <p className="text-primary/70 text-[10px] font-semibold tracking-wider uppercase">Staking & Rewards</p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ArrowLeftRightIcon}
              size={14}
              className="text-muted-foreground/60 rotate-180 transition-transform group-hover:translate-x-1"
            />
          </div>
        </Link>
        <div className="border-border bg-muted/10 space-y-6 rounded-2xl border p-5">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/60 text-[10px] font-black tracking-[0.2em] uppercase">
              Manage Session
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="bg-muted/10 border-border flex items-center justify-between rounded-xl border px-3 py-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <code className="text-muted-foreground/80 truncate text-[11px] font-medium tracking-tight">
                  {address || ""}
                </code>
                {isReadOnly && (
                  <span className="bg-destructive/10 text-destructive shrink-0 rounded px-1.5 py-0.5 text-[8px] font-black uppercase">
                    Read-Only
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <SyncWalletDialog />
                <Button variant="ghost" size="sm" className="h-7 w-7 rounded-md p-0" onClick={copyAddress}>
                  <HugeiconsIcon icon={Copy01Icon} size={12} className="opacity-70" />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive h-10 w-full rounded-xl text-xs font-bold transition-colors"
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
