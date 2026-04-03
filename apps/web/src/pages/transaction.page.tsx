import { fixedPointToString } from "@ckb-ccc/core"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@polymeer/ui"
import { cn } from "@polymeer/ui/lib/utils"
import { Link } from "@tanstack/react-router"

import { useAddress } from "@/hooks/use-address"
import { TransactionType, useTransactions } from "@/hooks/use-transactions"

export function TransactionPage() {
  const { scripts, isLoading: isLoadingAddress } = useAddress()

  const {
    transactions,
    isLoading: isTxLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTransactions(scripts)

  const formatAmount = (amount: bigint) => {
    return Number(fixedPointToString(amount)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    })
  }

  if (isLoadingAddress) {
    return (
      <div className="w-full max-w-4xl py-20">
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl space-y-10 py-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="border-border bg-card/30 rounded-[32px] shadow-none border overflow-hidden">
        <CardHeader className="border-border border-b px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="hover:bg-muted/50 h-10 w-10 rounded-xl p-0 transition-all">
                  <span className="font-bold text-lg">&larr;</span>
                </Button>
              </Link>
              <div className="space-y-0.5">
                <CardTitle className="text-foreground text-xl font-black">Activity</CardTitle>
                <CardDescription className="text-sm font-medium text-muted-foreground/60">
                  Past transactions and status
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-border hover:bg-transparent border-b">
                  <TableHead className="h-14 font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground/40 pl-8">Transaction</TableHead>
                  <TableHead className="h-14 font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground/40">Date</TableHead>
                  <TableHead className="h-14 font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground/40">Type</TableHead>
                  <TableHead className="h-14 font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground/40 text-right pr-8">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTxLoading && transactions.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border hover:bg-transparent border-b">
                      <TableCell colSpan={4} className="py-8 px-8">
                        <Skeleton className="h-5 w-full rounded-lg bg-muted/20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="h-80 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="text-base font-bold text-muted-foreground/40">No activity yet</p>
                        <p className="text-xs font-medium text-muted-foreground/20 italic">Your transaction history will be shown here</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.hash} className="border-border transition-colors hover:bg-muted/10 group border-b">
                      <TableCell className="py-6 pl-8">
                        <a
                          href={`https://explorer.nervos.org/transaction/${tx.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors"
                          title={tx.hash}
                        >
                          {tx.hash.substring(0, 12)}...{tx.hash.substring(tx.hash.length - 8)}
                        </a>
                      </TableCell>
                      <TableCell className="py-6">
                        <span className="text-sm font-bold text-muted-foreground/60">{tx.date}</span>
                      </TableCell>
                      <TableCell className="py-6">
                        <Badge
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border-none shadow-none",
                            tx.type === TransactionType.RECEIVE_NATIVE_TOKEN
                              ? "bg-emerald-500/10 text-emerald-500"
                              : tx.type === TransactionType.SEND_NATIVE_TOKEN
                                ? "bg-rose-500/10 text-rose-500"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {tx.type.split("_")[0]}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "py-6 pr-8 text-right font-black tracking-tight text-base",
                          tx.type === TransactionType.RECEIVE_NATIVE_TOKEN || tx.type === TransactionType.CLAIM_DAO
                            ? "text-emerald-500"
                            : tx.type === TransactionType.SEND_NATIVE_TOKEN ||
                                tx.type === TransactionType.DEPOSIT_DAO ||
                                tx.type === TransactionType.WITHDRAW_DAO
                              ? "text-foreground"
                              : "text-foreground"
                        )}
                      >
                        <span className="opacity-40 mr-1 text-xs">
                          {tx.type === TransactionType.RECEIVE_NATIVE_TOKEN || tx.type === TransactionType.CLAIM_DAO
                            ? "+"
                            : "-"}
                        </span>
                        {formatAmount(tx.amount)}
                        <span className="ml-1.5 text-[10px] font-black opacity-30 uppercase">CKB</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {hasNextPage && (
            <div className="flex justify-center p-10 bg-muted/5">
              <Button 
                variant="ghost" 
                onClick={() => fetchNextPage()} 
                disabled={isFetchingNextPage}
                className="h-12 px-8 rounded-[20px] font-black text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/20"
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
