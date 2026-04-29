import { useQuery } from "@tanstack/react-query"

import { useConfigStore } from "@/stores/config.store"
import { useFiberPeerStore } from "@/stores/fiber-peer.store"

import { useFiberWorker } from "./use-fiber-worker"

export function useChannels() {
  const worker = useFiberWorker()
  const network = useConfigStore((s) => s.network)
  const clientMode = useConfigStore((s) => s.clientMode)
  const peerAddresses = useFiberPeerStore((s) => s.peerAddresses)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["fiber-channels", network, clientMode],
    queryFn: async () => {
      const res = await worker.listChannels({})
      // Only attempt reconnect if we have channels
      if (res.channels.length > 0) {
        try {
          const peersRes = await worker.listPeers()
          const connectedPubkeys = new Set(peersRes.peers.map((p) => p.pubkey))

          for (const ch of res.channels) {
            if (!connectedPubkeys.has(ch.pubkey)) {
              const address = peerAddresses[ch.pubkey]
              if (address) {
                console.debug(`[useChannels] Proactively reconnecting to ${ch.pubkey} at ${address}`)
                worker.connectPeer({ address, save: true }).catch(() => {})
              }
            }
          }
        } catch (e) {
          console.error("Failed to check peers for reconnection:", e)
        }
      }
      return res
    },
    refetchInterval: 10000,
  })

  return {
    channels: data?.channels ?? [],
    isLoading,
    isRefetching,
    refetchChannels: refetch,
  }
}
