import { create } from "zustand"
import { persist } from "zustand/middleware"

interface FiberPeerState {
  peerAddresses: Record<string, string> // pubkey -> multiaddr
  savePeerAddress: (pubkey: string, address: string) => void
}

export const useFiberPeerStore = create<FiberPeerState>()(
  persist(
    (set) => ({
      peerAddresses: {},
      savePeerAddress: (pubkey, address) =>
        set((state) => ({
          peerAddresses: {
            ...state.peerAddresses,
            [pubkey]: address,
          },
        })),
    }),
    {
      name: "fiber-peer-storage",
    }
  )
)
