import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ConfigState {
  network: "testnet" | "mainnet"
  clientMode: "light" | "full"
  initialized: boolean

  setNetwork: (network: "testnet" | "mainnet") => void
  setClientMode: (mode: "light" | "full") => void
  setInitialized: (initialized: boolean) => void
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      network: "testnet",
      clientMode: "full",
      initialized: false,
      setNetwork: (network) => set({ network }),
      setClientMode: (clientMode) => set({ clientMode }),
      setInitialized: (initialized) => set({ initialized }),
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
