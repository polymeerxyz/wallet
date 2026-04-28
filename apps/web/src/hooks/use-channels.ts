import { useQuery } from "@tanstack/react-query"

import { useConfigStore } from "@/stores/config.store"

import { useFiberWorker } from "./use-fiber-worker"

export function useChannels() {
  const worker = useFiberWorker()
  const network = useConfigStore((s) => s.network)
  const clientMode = useConfigStore((s) => s.clientMode)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["fiber-channels", network, clientMode],
    queryFn: () => worker.listChannels({}),
    refetchInterval: 10000,
  })

  return {
    channels: data?.channels ?? [],
    isLoading,
    isRefetching,
    refetchChannels: refetch,
  }
}
