import { useQuery } from "@tanstack/react-query"

import { useConfigStore } from "@/stores/config.store"
import { useFiberPeerStore } from "@/stores/fiber-peer.store"

import { useFiberWorker } from "./use-fiber-worker"

export function usePeers() {
  const worker = useFiberWorker()
  const network = useConfigStore((s) => s.network)
  const clientMode = useConfigStore((s) => s.clientMode)
  const savePeerAddress = useFiberPeerStore((s) => s.savePeerAddress)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["fiber-peers", network, clientMode],
    queryFn: async () => {
      const res = await worker.listPeers()
      if (res.peers) {
        for (const peer of res.peers) {
          if (peer.pubkey && peer.address) {
            savePeerAddress(peer.pubkey, peer.address)
          }
        }
      }
      return res
    },
    refetchInterval: 10000,
  })

  return {
    peers: data?.peers ?? [],
    isLoading,
    isRefetching,
    refetchPeers: refetch,
  }
}
