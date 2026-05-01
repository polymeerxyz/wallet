import { Invoice01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge, cn, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@polymeer/ui"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useEffect } from "react"

import { useAddress } from "@/hooks/use-address"
import { TransactionType, useTransactions } from "@/hooks/use-transactions"
import { formatAmount, getExplorerLink } from "@/lib/utils"
import { useConfigStore } from "@/stores/config.store"

export function TransactionPage() {
  const queryClient = useQueryClient()
  const { scripts, address, isLoading: isLoadingAddress } = useAddress()
  const network = useConfigStore((s) => s.network)

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["ckb-transactions"] })
  }, [queryClient])

  const { transactions: allTransactions, isLoading: isTxLoading } = useTransactions(scripts)
  const transactions = allTransactions.slice(0, 20)

  if (isLoadingAddress) {
    return (
      <div className="w-full max-w-4xl py-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-4xl space-y-6 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Activity</h1>
          <p className="text-muted-foreground/50 text-[10px] font-semibold tracking-wider uppercase">
            Past transactions and status
          </p>
        </div>
        <Link
          to="/"
          className="text-muted-foreground/60 hover:text-primary text-[10px] font-bold uppercase transition-colors"
        >
          Back to Overview
        </Link>
      </div>

      {/* Transactions List */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <div className="bg-muted/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <HugeiconsIcon icon={Invoice01Icon} className="text-muted-foreground" size={16} />
          </div>
          <div>
            <h3 className="text-muted-foreground/70 text-[10px] font-bold tracking-wider uppercase">
              Transaction History
            </h3>
            <p className="text-muted-foreground/50 mt-0.5 text-[10px]">Recent on-chain activity</p>
          </div>
        </div>

        <div className="border-border/40 bg-muted/5 overflow-hidden rounded-2xl border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-border/20 border-b hover:bg-transparent">
                  <TableHead className="text-muted-foreground/60 h-10 pl-6 text-[10px] font-bold uppercase">
                    Transaction
                  </TableHead>
                  <TableHead className="text-muted-foreground/60 h-10 text-[10px] font-bold uppercase">Date</TableHead>
                  <TableHead className="text-muted-foreground/60 h-10 text-[10px] font-bold uppercase">Type</TableHead>
                  <TableHead className="text-muted-foreground/60 h-10 pr-6 text-right text-[10px] font-bold uppercase">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTxLoading && transactions.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border/10 border-b">
                      <TableCell colSpan={4} className="px-6 py-4">
                        <Skeleton className="bg-muted/20 h-4 w-full rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 py-8">
                        <p className="text-muted-foreground/60 text-sm font-bold">No activity yet</p>
                        <p className="text-muted-foreground/40 text-[10px] font-medium italic">
                          Transactions will appear here after confirmation
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow
                      key={tx.hash}
                      className="border-border/10 hover:bg-muted/10 border-b text-[13px] transition-colors"
                    >
                      <TableCell className="py-3.5 pl-6">
                        <a
                          href={getExplorerLink(tx.hash, network)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-foreground hover:text-primary text-sm font-bold tabular-nums transition-colors"
                          title={tx.hash}
                        >
                          {tx.hash.substring(0, 10)}...{tx.hash.substring(tx.hash.length - 8)}
                        </a>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-muted-foreground/70 text-xs font-semibold">{tx.date}</span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "rounded-lg border-none px-2.5 py-0.5 text-[9px] font-bold uppercase shadow-none",
                            tx.type === TransactionType.RECEIVE_NATIVE_TOKEN
                              ? "bg-success/10 text-success"
                              : tx.type === TransactionType.SEND_NATIVE_TOKEN
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground/80"
                          )}
                        >
                          {tx.type.split("_")[0]}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "py-3.5 pr-6 text-right text-sm font-bold tabular-nums",
                          tx.type === TransactionType.RECEIVE_NATIVE_TOKEN || tx.type === TransactionType.UNLOCK_DAO
                            ? "text-success"
                            : "text-foreground opacity-90"
                        )}
                      >
                        <span className="mr-0.5 opacity-70">
                          {tx.type === TransactionType.RECEIVE_NATIVE_TOKEN || tx.type === TransactionType.UNLOCK_DAO
                            ? "+"
                            : "-"}
                        </span>
                        {formatAmount(tx.amount)}
                        <span className="ml-1 text-[9px] font-bold uppercase opacity-40">CKB</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {address && (
            <div className="bg-muted/5 border-border/10 flex justify-center border-t py-4">
              <a
                href={getExplorerLink(address, network, "address")}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground/80 hover:text-foreground text-[10px] font-bold uppercase transition-colors"
              >
                View All Activity in Explorer &rarr;
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
