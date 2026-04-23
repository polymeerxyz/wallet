import { Address } from "@ckb-ccc/core"
import {
  ArrowDown01Icon,
  ArrowLeftRightIcon,
  Copy01Icon,
  Link01Icon,
  SafeIcon,
  Wallet02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
} from "@polymeer/ui"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"

import { useAddress } from "@/hooks/use-address"
import { useBalance, useBalances } from "@/hooks/use-balance"
import { getExplorerLink } from "@/lib/utils"
import { useConfigStore } from "@/stores/config.store"
import { useWalletStore, WalletDerivationStrategy } from "@/stores/wallet.store"

import { BalanceDisplay } from "../components/balance-display"
import { ReceiveDialog } from "../components/receive-dialog"
import { SyncWalletDialog } from "../components/sync-wallet-dialog"

export function OverviewPage() {
  const queryClient = useQueryClient()
  const { address, scripts, scriptsWithPaths, isLoading: isLoadingAddress } = useAddress()

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["ckb-balance"] })
  }, [queryClient])

  const clearWallet = useWalletStore((state) => state.clearWallet)
  const isReadOnly = useWalletStore((state) => state.isReadOnly)
  const derivationStrategy = useWalletStore((state) => state.derivationStrategy)
  const setDerivationStrategy = useWalletStore((state) => state.setDerivationStrategy)
  const network = useConfigStore((state) => state.network)
  const navigate = useNavigate()

  const { data: totalBalance, isLoading: isTotalBalanceLoading } = useBalance(scripts)

  // Fetch individual balances for each address
  const individualBalances = useBalances(scriptsWithPaths)

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

  const copyAddress = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const truncateAddress = (addr: string) => {
    if (!addr) return ""
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`
  }

  if (isLoadingAddress) {
    return (
      <div className="w-full max-w-md py-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-md space-y-4 duration-700">
      {/* Total Balance Section */}
      <section className="flex flex-col items-center justify-center space-y-2 text-center">
        <span className="text-muted-foreground/60 text-[11px] font-bold uppercase">Total Balance</span>
        <div className="flex flex-col items-center">
          <BalanceDisplay amount={totalBalance ?? 0} size="xl" className={isTotalBalanceLoading ? "opacity-50" : ""} />
          <p className="text-muted-foreground/40 mt-1 text-sm font-medium">≈ $0.00 USD</p>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex w-full gap-3">
          <Link to="/send" className="flex-1">
            <Button className="h-10 w-full rounded-xl text-sm font-bold transition-all active:scale-[0.98]">
              Send
            </Button>
          </Link>
          <ReceiveDialog address={address ?? ""}>
            <Button
              variant="secondary"
              className="h-10 flex-1 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
            >
              Receive
            </Button>
          </ReceiveDialog>
        </div>
      </section>

      {/* Navigations */}
      <section className="grid grid-cols-2 gap-3">
        <Link to="/transactions" className="block">
          <div className="border-border/40 bg-muted/5 hover:bg-muted/10 group flex flex-col justify-between rounded-2xl border p-3.5 transition-all hover:scale-[1.01]">
            <div className="bg-muted/10 mb-3 flex h-10 w-10 items-center justify-center rounded-xl">
              <HugeiconsIcon icon={ArrowLeftRightIcon} size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-foreground text-[13px] font-bold">Transactions</p>
              <p className="text-muted-foreground/50 text-[9px] font-semibold uppercase">Activity</p>
            </div>
          </div>
        </Link>
        <Link to="/dao" className="block">
          <div className="border-primary/20 bg-primary/5 hover:bg-primary/10 group flex flex-col justify-between rounded-2xl border p-3.5 transition-all hover:scale-[1.01]">
            <div className="bg-primary/10 mb-3 flex h-10 w-10 items-center justify-center rounded-xl">
              <HugeiconsIcon icon={SafeIcon} size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-foreground text-[13px] font-bold">DAO</p>
              <p className="text-primary/60 text-[9px] font-semibold uppercase">Staking</p>
            </div>
          </div>
        </Link>
      </section>

      {/* Asset Details / UTXO Addresses */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-muted-foreground/70 text-[10px] font-bold uppercase">Asset Details</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-muted/10 text-muted-foreground/60 h-6 gap-1 px-1.5 text-[10px] font-bold"
              >
                Account:{" "}
                {derivationStrategy === WalletDerivationStrategy.UTXO_BASED
                  ? "UTXO / BIP 44"
                  : derivationStrategy === WalletDerivationStrategy.ACCOUNT_BASED
                    ? "Neuron Compatible"
                    : "Single Address"}
                <HugeiconsIcon icon={ArrowDown01Icon} size={10} className="opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem
                className="text-xs font-bold"
                onClick={() => setDerivationStrategy(WalletDerivationStrategy.ACCOUNT_BASED)}
              >
                Neuron Compatible
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs font-bold"
                onClick={() => setDerivationStrategy(WalletDerivationStrategy.SINGLE_ADDRESS)}
              >
                Fixed Address
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs font-bold"
                onClick={() => setDerivationStrategy(WalletDerivationStrategy.UTXO_BASED)}
              >
                UTXO / BIP 44
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="border-border/40 bg-muted/5 overflow-hidden rounded-2xl border">
          {derivationStrategy === WalletDerivationStrategy.UTXO_BASED && scriptsWithPaths.length > 0 ? (
            <div className="divide-border/30 divide-y">
              {scriptsWithPaths.map((item, index) => {
                const addr = Address.from({ script: item.script, prefix: network === "mainnet" ? "ckb" : "ckt" })
                const bal = individualBalances[index]?.data ?? 0
                const isLoading = individualBalances[index]?.isLoading

                return (
                  <div
                    key={item.path}
                    className="hover:bg-muted/10 group flex items-center justify-between p-4 transition-colors"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <code className="text-foreground truncate text-xs leading-none font-bold">
                          {truncateAddress(addr.toString())}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 shrink-0 bg-transparent p-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => copyAddress(addr.toString())}
                        >
                          <HugeiconsIcon icon={Copy01Icon} size={10} />
                        </Button>
                      </div>
                      <span className="text-muted-foreground/50 truncate text-[10px] leading-none font-medium">
                        {item.path}
                      </span>
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      {isLoading ? (
                        <Skeleton className="ml-auto h-4 w-16" />
                      ) : (
                        <BalanceDisplay amount={bal} size="sm" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                  <HugeiconsIcon icon={Wallet02Icon} size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-foreground truncate text-xs font-bold">Main Address</p>
                  <p className="text-muted-foreground/50 truncate text-[10px] font-medium">
                    {derivationStrategy === WalletDerivationStrategy.ACCOUNT_BASED ? "m/44'/309'/0'" : "Default"}
                  </p>
                </div>
              </div>
              <div className="ml-4 shrink-0">
                <BalanceDisplay amount={totalBalance ?? 0} size="sm" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Session Management */}
      <section className="space-y-3 pt-2">
        <div className="px-1">
          <h3 className="text-muted-foreground/70 text-[10px] font-bold uppercase">Manage Session</h3>
        </div>
        <div className="border-border/40 bg-muted/5 flex flex-col gap-3 rounded-2xl border p-4">
          <div className="bg-background/50 border-border/30 flex items-center justify-between rounded-xl border px-3 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                className="hover:text-foreground group flex min-w-0 cursor-pointer items-center gap-1 transition-colors"
                onClick={() => copyAddress(address || "")}
                title="Copy address"
              >
                <code className="text-muted-foreground/80 group-hover:text-primary truncate text-[10px] leading-none font-medium transition-colors">
                  {address || ""}
                </code>
                <HugeiconsIcon
                  icon={Copy01Icon}
                  size={10}
                  className="text-muted-foreground/40 group-hover:text-primary transition-colors"
                />
              </button>
              {isReadOnly && (
                <span className="bg-destructive/10 text-destructive shrink-0 rounded px-1 py-0.5 text-[8px] font-bold uppercase">
                  Read-Only
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <SyncWalletDialog />
              <a
                href={getExplorerLink(address || "", network, "address")}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground/60 hover:bg-muted hover:text-foreground flex h-6 w-6 items-center justify-center rounded-md transition-all"
                title="View on Explorer"
              >
                <HugeiconsIcon icon={Link01Icon} size={12} />
              </a>
            </div>
          </div>
          <Button
            variant="ghost"
            className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive h-9 w-full rounded-xl text-xs font-bold transition-all"
            onClick={disconnect}
          >
            Disconnect Wallet
          </Button>
        </div>
      </section>
    </div>
  )
}
