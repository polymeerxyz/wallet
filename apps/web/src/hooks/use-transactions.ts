import type { ScriptLike } from "@ckb-ccc/core"
import type { TransactionHistoryItem as LibTransactionHistoryItem } from "@polymeer/lib"
import { TransactionType } from "@polymeer/lib"
import { useInfiniteQuery } from "@tanstack/react-query"

import { useWalletStore } from "@/stores/wallet.store"

import { useCkbWorker } from "./use-ckb-worker"

export { TransactionType }

export interface TransactionHistoryItem extends Omit<LibTransactionHistoryItem, "amount"> {
  amount: bigint
}

export function useTransactions(scripts: ScriptLike[]) {
  const network = useWalletStore((s) => s.network)
  const worker = useCkbWorker()

  const query = useInfiniteQuery({
    queryKey: ["ckb-transactions", network, scripts.map((s) => s.args).join("-")],
    queryFn: async ({ pageParam }) => {
      if (scripts.length === 0) return { transactions: [], cursors: {} }

      const res = await worker.getTransactions(scripts, pageParam)

      const txs = (res.transactions as unknown as Array<{ amount: string; [key: string]: unknown }>).map((tx) => ({
        ...tx,
        amount: BigInt(tx.amount),
      })) as TransactionHistoryItem[]

      return { transactions: txs, cursors: res.cursors }
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.transactions.length > 0 && Object.keys(lastPage.cursors).length > 0) {
        return lastPage.cursors
      }
      return undefined
    },
    initialPageParam: undefined as Record<string, string> | undefined,
    enabled: scripts.length > 0,
  })

  const allTransactions = query.data?.pages.flatMap((page) => page.transactions) || []

  return {
    transactions: allTransactions,
    isLoading: query.isLoading,
    refetch: query.refetch,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}
