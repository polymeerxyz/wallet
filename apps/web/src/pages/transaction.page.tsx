import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@polymeer/ui"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useEffect } from "react"

import { useAddress } from "@/hooks/use-address"
import { TransactionType, useTransactions } from "@/hooks/use-transactions"
import { formatAmount, getExplorerLink } from "@/lib/utils"
import { useWalletStore } from "@/stores/wallet.store"

export function TransactionPage() {
  const queryClient = useQueryClient()
  const { scripts, isLoading: isLoadingAddress } = useAddress()
  const network = useWalletStore((s) => s.network)

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["ckb-transactions"] })
  }, [queryClient])

  const {
    transactions,
    isLoading: isTxLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTransactions(scripts)

  if (isLoadingAddress) {
    return (
      <div className="w-full max-w-4xl py-20">
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-4xl space-y-6 py-4 duration-700">
      <Card className="border-border/50 bg-muted/10 overflow-hidden rounded-3xl border shadow-none">
        <CardHeader className="border-border/50 border-b px-6 py-5">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl transition-all">
                <span className="text-lg leading-none font-bold">&larr;</span>
              </Button>
            </Link>
            <div className="space-y-0.5">
              <CardTitle className="text-foreground text-lg font-bold">Activity</CardTitle>
              <CardDescription className="text-muted-foreground/70 text-xs font-medium italic">
                Past transactions and status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-border/20 border-b hover:bg-transparent">
                  <TableHead className="text-muted-foreground/60 h-12 pl-6 text-[10px] font-bold tracking-[0.2em] uppercase">
                    Transaction
                  </TableHead>
                  <TableHead className="text-muted-foreground/60 h-12 text-[10px] font-bold tracking-[0.2em] uppercase">
                    Date
                  </TableHead>
                  <TableHead className="text-muted-foreground/60 h-12 text-[10px] font-bold tracking-[0.2em] uppercase">
                    Type
                  </TableHead>
                  <TableHead className="text-muted-foreground/60 h-12 pr-6 text-right text-[10px] font-bold tracking-[0.2em] uppercase">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTxLoading && transactions.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border/10 border-b">
                      <TableCell colSpan={4} className="px-6 py-6">
                        <Skeleton className="bg-muted/20 h-4 w-full rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 py-10">
                        <p className="text-muted-foreground/60 text-sm font-bold">No activity yet</p>
                        <p className="text-muted-foreground/40 text-[10px] font-medium italic">
                          Transactions will appear here after confirmation
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.hash} className="border-border/10 hover:bg-muted/10 border-b transition-colors">
                      <TableCell className="py-5 pl-6">
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
                      <TableCell className="py-5">
                        <span className="text-muted-foreground/70 text-xs font-semibold">{tx.date}</span>
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "rounded-lg border-none px-2.5 py-0.5 text-[9px] font-black tracking-widest uppercase shadow-none",
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
                          "py-5 pr-6 text-right text-sm font-black tracking-tight tabular-nums",
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
                        <span className="ml-1 text-[9px] font-black tracking-tighter uppercase opacity-40">CKB</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {hasNextPage && (
            <div className="bg-muted/5 border-border/10 flex justify-center border-t py-8">
              <Button
                variant="ghost"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-muted-foreground/80 hover:text-foreground hover:bg-muted/10 h-9 rounded-xl px-6 text-[10px] font-bold tracking-widest uppercase transition-all"
              >
                {isFetchingNextPage ? "Syncing..." : "Load More Activity"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
