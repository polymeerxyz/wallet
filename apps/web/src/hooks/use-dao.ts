import { Script } from "@ckb-ccc/core"
import { useQuery } from "@tanstack/react-query"

import { useConfigStore } from "../stores/config.store"
import { useAddress } from "./use-address"
import { useCkbWorker } from "./use-ckb-worker"

export function useDao() {
  const { scripts } = useAddress()
  const worker = useCkbWorker()
  const network = useConfigStore((s) => s.network)
  const clientMode = useConfigStore((s) => s.clientMode)

  const { data: cells = [], isLoading: isLoadingCells } = useQuery({
    queryKey: ["dao-cells", network, clientMode, scripts.map((s) => Script.from(s).hash()).join("-")],
    queryFn: () => worker.getDaoCells(scripts),
    enabled: scripts.length > 0,
    refetchInterval: 10000,
  })

  const { data: apy = "0.00", isLoading: isLoadingApy } = useQuery({
    queryKey: ["dao-apy", network, clientMode],
    queryFn: () => worker.getDaoAPY(),
    refetchInterval: 60000,
  })

  return {
    cells,
    apy,
    isLoading: isLoadingCells || isLoadingApy,
  }
}
