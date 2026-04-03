import { useQuery } from "@tanstack/react-query"

import { useWalletStore } from "../stores/wallet.store"
import { useAddress } from "./use-address"
import { useCkbWorker } from "./use-ckb-worker"

export function useDao() {
  const { scripts } = useAddress()
  const worker = useCkbWorker()
  const network = useWalletStore((s) => s.network)

  const { data: cells = [], isLoading: isLoadingCells } = useQuery({
    queryKey: ["dao-cells", scripts, network],
    queryFn: () => worker.getDaoCells(scripts),
    enabled: scripts.length > 0,
    refetchInterval: 10000,
  })

  const { data: apy = "0.00", isLoading: isLoadingApy } = useQuery({
    queryKey: ["dao-apy", network],
    queryFn: () => worker.getDaoAPY(),
    refetchInterval: 60000,
  })

  return {
    cells,
    apy,
    isLoading: isLoadingCells || isLoadingApy,
  }
}
