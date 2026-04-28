import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ConfigState {
  network: "testnet" | "mainnet"
  clientMode: "light" | "full"

  setNetwork: (network: "testnet" | "mainnet") => void
  setClientMode: (mode: "light" | "full") => void
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      network: "testnet",
      clientMode: "full",
      setNetwork: (network) => set({ network }),
      setClientMode: (clientMode) => set({ clientMode }),
    }),
    {
      name: "config-storage",
      partialize: (state) => ({
        network: state.network,
        clientMode: state.clientMode,
      }),
    }
  )
)
