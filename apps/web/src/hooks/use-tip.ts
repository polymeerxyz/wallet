import { useQuery } from "@tanstack/react-query"

import { useConfigStore } from "../stores/config.store"
import { useCkbWorker } from "./use-ckb-worker"

export function useTip() {
  const worker = useCkbWorker()
  const network = useConfigStore((s) => s.network)
  const clientMode = useConfigStore((s) => s.clientMode)

  const { data: tip, isLoading: isTipLoading } = useQuery({
    queryKey: ["ckb-tip", network, clientMode],
    queryFn: () => worker.getTipHeader(),
    refetchInterval: 10000,
  })

  const { data: syncProgress, isLoading: isSyncLoading } = useQuery({
    queryKey: ["ckb-sync", network, clientMode],
    queryFn: () => worker.getSyncProgress(),
    refetchInterval: 10000,
  })

  return {
    tip,
    syncProgress: clientMode === "full" ? 100 : (syncProgress ?? 0),
    isLoading: isTipLoading || (clientMode === "light" && isSyncLoading),
  }
}
