import type { CellLike, ClientBlockHeaderLike, EpochLike } from "@ckb-ccc/core"
import { hexFrom } from "@ckb-ccc/core"
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Coins01Icon,
  SafeIcon,
  SortingAZ01Icon,
  SortingZA01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, cn, Input, Skeleton, toast } from "@polymeer/ui"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { BalanceDisplay } from "@/components/balance-display"
import { useDao } from "@/hooks/use-dao"
import { useTip } from "@/hooks/use-tip"
import { useSigningStore } from "@/stores/signing.store"
import { useWalletStore } from "@/stores/wallet.store"

function calculateCycleInfo(targetEpoch: EpochLike, tip: ClientBlockHeaderLike) {
  const currentTotal = Number(tip.epoch[0]) + Number(tip.epoch[1]) / Number(tip.epoch[2])
  const targetTotal = Number(targetEpoch[0]) + Number(targetEpoch[1]) / Number(targetEpoch[2])

  // Cylces are 180 epochs
  const startTotal = targetTotal - 180
  const remaining = Math.max(0, targetTotal - currentTotal)
  const progress = Math.min(100, Math.max(0, ((currentTotal - startTotal) / 180) * 100))

  // 4 hours per epoch
  const remainingMs = remaining * 4 * 60 * 60 * 1000
  const date = new Date(Date.now() + remainingMs)

  // Estimate block
  const remainingBlocks = Math.floor(remaining * Number(tip.epoch[2]))
  const targetBlock = Number(tip.number) + remainingBlocks

  // "Soon" is < 3 days (72 hours)
  const isExpiringSoon = remaining > 0 && remainingMs < 3 * 24 * 60 * 60 * 1000

  return {
    remaining,
    progress,
    date,
    targetBlock,
    isExpiringSoon,
  }
}

function DaoProgressBar({ targetEpoch, type }: { targetEpoch?: EpochLike; type: "deposit" | "withdraw" }) {
  const { tip } = useTip()
  if (!tip || !targetEpoch) return null

  const { progress, isExpiringSoon } = calculateCycleInfo(targetEpoch, tip)

  return (
    <div className="w-full space-y-1.5 md:max-w-40">
      <div className="flex items-center justify-between gap-1 px-0.5">
        <span className="text-muted-foreground/50 text-[8px] font-semibold uppercase">
          {type === "deposit" ? "Cycle" : "Maturity"}
        </span>
        <span
          className={cn(
            "text-[9px] font-semibold tabular-nums",
            isExpiringSoon ? "text-warning animate-pulse" : "text-muted-foreground/60"
          )}
        >
          {progress.toFixed(1)}%
        </span>
      </div>
      <div className="bg-muted/20 relative h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={`h-full transition-all duration-1000 ${
            type === "deposit"
              ? isExpiringSoon
                ? "bg-warning shadow-[0_0_8px_color-mix(in_oklch,var(--color-warning)_40%,transparent)]"
                : "bg-success/50"
              : "bg-primary"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {isExpiringSoon && type === "deposit" && (
        <p className="animate-in slide-in-from-top-1 text-warning px-1 text-[9px] font-bold">
          ⚠️ Ending in &lt; 3 days
        </p>
      )}
    </div>
  )
}

function MaturityEstimate({ targetEpoch }: { targetEpoch?: EpochLike }) {
  const { tip } = useTip()
  if (!tip || !targetEpoch) return null

  const { remaining, date, targetBlock } = calculateCycleInfo(targetEpoch, tip)

  return (
    <div className="text-right">
      <p className="text-muted-foreground/50 text-[8px] font-bold uppercase">Est. Block</p>
      <div className="flex flex-col">
        <p className="text-foreground text-[11px] font-bold tabular-nums sm:text-[12px]">
          #{targetBlock.toLocaleString()}
        </p>
        <p className="text-muted-foreground/40 text-[9px] font-medium italic sm:text-[10px]">
          {remaining === 0
            ? "Matured"
            : `≈ ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        </p>
      </div>
    </div>
  )
}

export function DaoPage() {
  const queryClient = useQueryClient()
  const { cells, apy, isLoading } = useDao()
  const { tip } = useTip()
  const openSigning = useSigningStore((s) => s.open)
  const isReadOnly = useWalletStore((s) => s.isReadOnly)
  const [depositAmount, setDepositAmount] = useState("")
  const [feeRate, setFeeRate] = useState("1000")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["dao-cells"] })
    queryClient.invalidateQueries({ queryKey: ["dao-apy"] })
    queryClient.invalidateQueries({ queryKey: ["ckb-tip"] })
  }, [queryClient])

  const handleDeposit = () => {
    if (!depositAmount) return
    const amountNum = Number(depositAmount)
    if (isNaN(amountNum) || amountNum < 102) {
      toast.error("Minimum DAO deposit is 102 CKB")
      return
    }

    openSigning({
      type: "dao_deposit",
      payload: { amount: depositAmount, feeRate },
    })
    setDepositAmount("")
  }

  const handleAction = (cell: CellLike) => {
    openSigning({
      type: cell.outputData === "0x0000000000000000" ? "dao_withdraw" : "dao_claim",
      payload: {
        txHash: hexFrom(cell.outPoint!.txHash),
        index: Number(cell.outPoint!.index),
        feeRate,
      },
    })
  }

  const sortedCells = [...cells].sort((a, b) => {
    const aNum = BigInt(a.info?.depositHeader?.number?.toString() ?? "0")
    const bNum = BigInt(b.info?.depositHeader?.number?.toString() ?? "0")
    return sortOrder === "desc" ? (bNum > aNum ? 1 : bNum < aNum ? -1 : 0) : aNum > bNum ? 1 : aNum < bNum ? -1 : 0
  })

  const totalStaked = cells.reduce((acc, c) => acc + BigInt(c.cell.cellOutput.capacity?.toString() || "0"), 0n)
  const totalProfit = cells.reduce((acc, c) => acc + BigInt(c.info?.profit || "0"), 0n)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-4xl space-y-6 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Nervos DAO</h1>
          <p className="text-muted-foreground/50 text-[10px] font-semibold tracking-wider uppercase">
            Stake CKB · Earn Issuance
          </p>
        </div>
        <Link
          to="/"
          className="text-muted-foreground/60 hover:text-primary text-[10px] font-bold uppercase transition-colors"
        >
          Back to Overview
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="border-border/40 bg-muted/5 flex flex-col justify-center rounded-2xl border p-4">
          <span className="text-muted-foreground/60 text-[10px] font-bold uppercase">Total Staked</span>
          <div className="mt-1 flex items-baseline gap-1">
            {isLoading ? <Skeleton className="h-7 w-24" /> : <BalanceDisplay amount={totalStaked} size="lg" />}
          </div>
        </div>

        <div className="border-border/40 bg-muted/5 flex flex-col justify-center rounded-2xl border p-4">
          <span className="text-muted-foreground/60 text-[10px] font-bold uppercase">Accumulated Profit</span>
          <div className="mt-1 flex items-baseline gap-1">
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <BalanceDisplay amount={totalProfit} size="lg" className="text-success" />
            )}
          </div>
        </div>

        <div className="border-primary/20 bg-primary/5 flex flex-col justify-center rounded-2xl border p-4">
          <span className="text-primary/70 text-[10px] font-bold uppercase">Current APY</span>
          <div className="mt-1">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-primary text-xl font-bold tabular-nums">{apy}%</p>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Action */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <HugeiconsIcon icon={SafeIcon} className="text-primary" size={16} />
          </div>
          <div>
            <h3 className="text-muted-foreground/70 text-[10px] font-bold tracking-wider uppercase">
              Deposit to Nervos DAO
            </h3>
            <p className="text-muted-foreground/50 mt-1 text-[10px]">Minimum 102 CKB. Locked per 180-epoch cycle.</p>
          </div>
        </div>

        <div className="border-border/40 bg-muted/5 space-y-4 rounded-3xl border p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-muted-foreground/60 px-1 text-[10px] font-bold uppercase">Amount</label>
              <div className="bg-background/50 border-border/30 flex items-center rounded-xl border px-3">
                <Input
                  type="number"
                  placeholder="Min 102 CKB"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="h-10 border-none bg-transparent text-sm font-bold shadow-none focus-visible:ring-0"
                />
                <span className="text-muted-foreground/40 shrink-0 pr-2 text-[10px] font-bold uppercase">CKB</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-muted-foreground/60 px-1 text-[10px] font-bold uppercase">Fee Rate</label>
              <div className="bg-background/50 border-border/30 flex items-center rounded-xl border px-3">
                <Input
                  type="number"
                  value={feeRate}
                  onChange={(e) => setFeeRate(e.target.value)}
                  className="h-10 border-none bg-transparent text-sm font-bold shadow-none focus-visible:ring-0"
                />
                <span className="text-muted-foreground/40 shrink-0 pr-2 text-[10px] font-bold uppercase">
                  shannons/kB
                </span>
              </div>
            </div>
          </div>
          <Button
            className="h-12 w-full rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
            onClick={handleDeposit}
            disabled={!depositAmount || isReadOnly}
          >
            {isReadOnly ? "View-Only Mode" : "Deposit Now"}
          </Button>
        </div>
      </section>

      {/* Deposits List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="bg-muted/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <HugeiconsIcon icon={Coins01Icon} className="text-muted-foreground" size={16} />
            </div>
            <div>
              <h3 className="text-muted-foreground/70 text-[10px] font-bold tracking-wider uppercase">Your Deposits</h3>
              <p className="text-muted-foreground/50 mt-0.5 text-[10px]">Active staking positions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/40 text-[10px] font-bold uppercase">{cells.length} Active</span>
            <button
              onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
              className="text-muted-foreground/40 hover:text-muted-foreground flex items-center gap-1 transition-colors"
              title={sortOrder === "desc" ? "Newest first" : "Oldest first"}
            >
              <HugeiconsIcon icon={sortOrder === "desc" ? SortingZA01Icon : SortingAZ01Icon} size={14} />
            </button>
          </div>
        </div>

        <div className="border-border/40 bg-muted/5 divide-border/30 divide-y overflow-hidden rounded-2xl border">
          {isLoading ? (
            <div className="space-y-0.5 p-0">
              <Skeleton className="h-20 w-full rounded-none" />
              <Skeleton className="h-20 w-full rounded-none" />
            </div>
          ) : cells.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <p className="text-muted-foreground/50 text-sm font-bold">No active deposits</p>
              <p className="text-muted-foreground/30 text-[9px] font-medium italic">
                Start staking your CKB to earn rewards
              </p>
            </div>
          ) : (
            sortedCells.map((item, idx) => (
              <div
                key={idx}
                className="hover:bg-muted/10 group grid grid-cols-1 gap-4 p-4 transition-colors md:grid-cols-[1fr_160px_220px] md:items-center"
              >
                {/* Left Column: Icon and Info */}
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      item.info?.type === "deposit" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    )}
                  >
                    <HugeiconsIcon icon={item.info?.type === "deposit" ? ArrowUp01Icon : ArrowDown01Icon} size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <BalanceDisplay
                        amount={BigInt(item.cell.cellOutput.capacity?.toString() || "0")}
                        size="md"
                        className="text-sm font-bold md:text-base"
                      />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase",
                          item.info?.type === "deposit" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        )}
                      >
                        {item.info?.type === "deposit" ? "Deposited" : "Withdrawing"}
                      </span>
                      <BalanceDisplay
                        amount={BigInt(item.info?.profit || "0")}
                        size="sm"
                        className="text-success text-[11px] font-bold"
                        unit="CKB"
                      />
                    </div>
                  </div>
                </div>

                {/* Middle Column: Progress Bar */}
                <div className="flex justify-start">
                  <DaoProgressBar targetEpoch={item.info?.targetEpoch} type={item.info?.type || "deposit"} />
                </div>

                {/* Right Column: Reward/Estimate and Action */}
                <div className="flex items-center justify-between gap-4 md:justify-end">
                  <div className="min-w-25 shrink-0 text-right">
                    {item.info?.type === "deposit" ? (
                      <div>
                        <p className="text-muted-foreground/50 text-[8px] font-bold uppercase">APY</p>
                        <p className="text-foreground text-[13px] font-bold">{apy}%</p>
                      </div>
                    ) : (
                      <MaturityEstimate targetEpoch={item.info?.targetEpoch} />
                    )}
                  </div>
                  <Button
                    variant={item.info?.type === "deposit" ? "secondary" : "default"}
                    className="h-9 min-w-[95px] shrink-0 rounded-xl text-[11px] font-semibold transition-all active:scale-[0.98] sm:h-10 sm:px-6"
                    onClick={() => handleAction(item.cell)}
                    disabled={
                      isReadOnly ||
                      (item.info?.type === "withdraw" &&
                        item.info?.targetEpoch &&
                        tip &&
                        Number(tip.epoch[0]) + Number(tip.epoch[1]) / Number(tip.epoch[2]) <
                          Number(item.info.targetEpoch[0]) +
                            Number(item.info.targetEpoch[1]) / Number(item.info.targetEpoch[2]))
                    }
                  >
                    {isReadOnly ? "View-Only" : item.info?.type === "deposit" ? "Withdraw" : "Claim"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
