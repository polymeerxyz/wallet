import { useQuery } from "@tanstack/react-query"

import { useWalletStore } from "../stores/wallet.store"
import { useCkbWorker } from "./use-ckb-worker"

export function useTip() {
  const worker = useCkbWorker()
  const network = useWalletStore((s) => s.network)

  const { data: tip, isLoading } = useQuery({
    queryKey: ["ckb-tip", network],
    queryFn: async () => {
      return worker.getTipHeader()
    },
    refetchInterval: 10000,
  })

  return {
    tip,
    isLoading,
  }
}
