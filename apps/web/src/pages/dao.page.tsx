import type { CellLike, ClientBlockHeaderLike, EpochLike } from "@ckb-ccc/core"
import { hexFrom } from "@ckb-ccc/core"
import { ArrowDown01Icon, ArrowUp01Icon, Clock01Icon, Coins01Icon, SafeIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Skeleton, toast } from "@polymeer/ui"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { useDao } from "@/hooks/use-dao"
import { useTip } from "@/hooks/use-tip"
import { formatAmount } from "@/lib/utils"
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
    <div className="w-full space-y-1.5 md:max-w-[200px]">
      <div className="flex items-center justify-between gap-1 px-1">
        <span className="text-muted-foreground/50 text-[9px] font-bold tracking-wider uppercase">
          {type === "deposit" ? "Interest Cycle" : "Maturity"}
        </span>
        <span
          className={`text-[9px] font-black tabular-nums ${isExpiringSoon ? "animate-pulse text-warning" : "text-muted-foreground/70"}`}
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
        <p className="animate-in slide-in-from-top-1 px-1 text-[9px] font-bold text-warning">
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
      <p className="text-muted-foreground/70 text-[9px] font-bold tracking-wider uppercase">Estimate</p>
      <div className="flex flex-col">
        <p className="text-foreground text-[12px] font-black tracking-tight tabular-nums sm:text-[13px]">
          #{targetBlock.toLocaleString()}
        </p>
        <p className="text-muted-foreground/60 text-[9px] font-medium italic sm:text-[10px]">
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

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["dao-cells"] })
    queryClient.invalidateQueries({ queryKey: ["dao-apy"] })
    queryClient.invalidateQueries({ queryKey: ["ckb-tip"] })
  }, [queryClient])

  const [depositAmount, setDepositAmount] = useState("")
  const [feeRate, setFeeRate] = useState("1000")

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

  const totalStaked = cells.reduce((acc, c) => acc + BigInt(c.cell.cellOutput.capacity?.toString() || "0"), 0n)
  const totalProfit = cells.reduce((acc, c) => acc + BigInt(c.info?.profit || "0"), 0n)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-4xl space-y-8 py-4 duration-700">
      {/* Header & Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-muted/10 rounded-3xl shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold tracking-wider uppercase">Total Staked</CardDescription>
            <CardTitle className="text-2xl font-black tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-24" /> : formatAmount(totalStaked)}
              <span className="ml-1 text-sm font-bold opacity-40">CKB</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/50 bg-muted/10 rounded-3xl shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold tracking-wider uppercase">
              Accumulated Profit
            </CardDescription>
            <CardTitle className="text-2xl font-black text-success tabular-nums">
              +{isLoading ? <Skeleton className="h-8 w-24" /> : formatAmount(totalProfit)}
              <span className="ml-1 text-sm font-bold opacity-40">CKB</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/50 bg-primary/10 rounded-3xl shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary/70 text-[10px] font-bold tracking-wider uppercase">
              Current APY
            </CardDescription>
            <CardTitle className="text-primary text-2xl font-black tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-16" /> : `${apy}%`}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Deposit Action */}
      <Card className="border-border/50 bg-muted/5 overflow-hidden rounded-3xl shadow-none">
        <CardHeader className="border-border/50 border-b px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
              <HugeiconsIcon icon={SafeIcon} className="text-primary" size={20} />
            </div>
            <div>
              <CardTitle className="text-foreground text-lg font-bold">Deposit to Nervos DAO</CardTitle>
              <CardDescription className="text-muted-foreground/70 text-xs font-medium italic">
                Stake your CKB to earn secondary issuance rewards
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-muted-foreground/70 px-1 text-[10px] font-bold tracking-[0.2em] uppercase">
                Amount
              </label>
              <div className="bg-muted/10 border-border/50 relative flex items-center rounded-xl border p-1">
                <Input
                  type="number"
                  placeholder="Minimum 102 CKB"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="h-12 border-none bg-transparent text-sm font-medium shadow-none focus-visible:ring-0"
                />
                <span className="text-muted-foreground/50 pr-4 text-[10px] font-black uppercase">CKB</span>
              </div>
            </div>
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
                <HugeiconsIcon icon={Clock01Icon} className="text-muted-foreground/40 pr-4" size={16} />
              </div>
            </div>
          </div>
          <Button
            className="mt-6 h-14 w-full rounded-2xl text-base font-bold tracking-tight shadow-none transition-all active:scale-[0.98]"
            onClick={handleDeposit}
            disabled={!depositAmount || isReadOnly}
          >
            {isReadOnly ? "View-Only Mode" : "Deposit Now"}
          </Button>
        </CardContent>
      </Card>

      {/* Deposits List */}
      <Card className="border-border/50 bg-muted/5 overflow-hidden rounded-3xl shadow-none">
        <CardHeader className="border-border/50 border-b px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-muted/20 flex h-10 w-10 items-center justify-center rounded-xl">
                <HugeiconsIcon icon={Coins01Icon} className="text-muted-foreground" size={20} />
              </div>
              <CardTitle className="text-foreground text-lg font-bold">Your Deposits</CardTitle>
            </div>
            <span className="text-muted-foreground/50 text-[10px] font-bold tracking-widest uppercase">
              {cells.length} Active
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <Skeleton className="mb-4 h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : cells.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="text-muted-foreground/60 text-sm font-bold">No active deposits</p>
              <p className="text-muted-foreground/40 text-[10px] font-medium italic">
                Start staking your CKB to earn rewards
              </p>
            </div>
          ) : (
            <div className="divide-border/20 divide-y">
              {cells.map((item, idx) => (
                <div
                  key={idx}
                  className="hover:bg-muted/5 group grid grid-cols-1 gap-6 p-6 transition-colors md:grid-cols-[1fr_200px_240px] md:items-center"
                >
                  {/* Left Column: Icon and Info */}
                  <div className="flex items-center gap-5">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        item.info?.type === "deposit"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={item.info?.type === "deposit" ? ArrowUp01Icon : ArrowDown01Icon}
                        size={24}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-foreground text-sm font-black tabular-nums sm:text-base">
                          {formatAmount(BigInt(item.cell.cellOutput.capacity?.toString() || "0"))}
                        </p>
                        <span className="text-muted-foreground/50 text-[10px] font-bold uppercase">CKB</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                            item.info?.type === "deposit"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {item.info?.type === "deposit" ? "Deposited" : "Withdrawing"}
                        </span>
                        <span className="text-[10px] font-bold text-success">
                          +{formatAmount(BigInt(item.info?.profit || "0"))} Profit
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Progress Bar */}
                  <div className="flex justify-start">
                    <DaoProgressBar targetEpoch={item.info?.targetEpoch} type={item.info?.type || "deposit"} />
                  </div>

                  {/* Right Column: Reward/Estimate and Action */}
                  <div className="flex items-center justify-between gap-6 md:justify-end">
                    {item.info?.type === "deposit" ? (
                      <div className="text-right">
                        <p className="text-muted-foreground/70 text-[9px] font-bold tracking-wider uppercase">APY</p>
                        <p className="text-foreground text-sm font-black">{apy}%</p>
                      </div>
                    ) : (
                      <MaturityEstimate targetEpoch={item.info?.targetEpoch} />
                    )}
                    <Button
                      variant={item.info?.type === "deposit" ? "secondary" : "default"}
                      className={`h-11 rounded-xl px-8 text-xs font-bold transition-all active:scale-[0.98] sm:px-10 ${
                        item.info?.type === "deposit" ? "bg-muted/20 hover:bg-muted/40" : ""
                      }`}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Link
          to="/"
          className="text-muted-foreground/60 hover:text-primary text-[10px] font-bold tracking-[0.2em] uppercase transition-colors"
        >
          Back to Overview
        </Link>
      </div>
    </div>
  )
}
