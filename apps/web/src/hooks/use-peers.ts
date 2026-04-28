import { useQuery } from "@tanstack/react-query"

import { useConfigStore } from "@/stores/config.store"

import { useFiberWorker } from "./use-fiber-worker"

export function usePeers() {
  const worker = useFiberWorker()
  const network = useConfigStore((s) => s.network)
  const clientMode = useConfigStore((s) => s.clientMode)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["fiber-peers", network, clientMode],
    queryFn: () => worker.listPeers(),
    refetchInterval: 10000,
  })

  return {
    peers: data?.peers ?? [],
    isLoading,
    isRefetching,
    refetchPeers: refetch,
  }
}
