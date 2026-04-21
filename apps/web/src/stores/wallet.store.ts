import { create } from "zustand"
import { persist } from "zustand/middleware"

export enum WalletDerivationStrategy {
  /**
   * Neuron-style: Uses the shorter path m/44'/309'/0'.
   * Best for: Users who want to sync with the official desktop wallet.
   */
  ACCOUNT_BASED = "ACCOUNT_BASED",

  /**
   * Standard BIP-44: Uses full path m/44'/309'/0'/0/x with Change support.
   * Best for: Privacy, Hardware Wallets (Ledger), and standard HD logic.
   */
  UTXO_BASED = "UTXO_BASED",

  /**
   * Fixed Address: Always uses index 0 (Ethereum-style).
   * Best for: Beginners, DApp interactions where address rotation is confusing.
   */
  SINGLE_ADDRESS = "SINGLE_ADDRESS",
}

interface WalletState {
  network: "testnet" | "mainnet"
  pendingNetwork: "testnet" | "mainnet" | null
  publicKey: string | null
  chainCode: string | null
  derivationStrategy: WalletDerivationStrategy
  isReadOnly: boolean

  setNetwork: (network: "testnet" | "mainnet") => void
  setPendingNetwork: (network: "testnet" | "mainnet" | null) => void
  setWallet: (payload: {
    publicKey: string
    chainCode: string
    derivationStrategy: WalletDerivationStrategy
    isReadOnly?: boolean
  }) => void
  setDerivationStrategy: (strategy: WalletDerivationStrategy) => void
  clearWallet: () => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      network: "testnet",
      pendingNetwork: null,
      publicKey: null,
      chainCode: null,
      derivationStrategy: WalletDerivationStrategy.ACCOUNT_BASED,
      isReadOnly: false,
      setNetwork: (network) => set({ network }),
      setPendingNetwork: (pendingNetwork) => set({ pendingNetwork }),
      setWallet: ({ publicKey, chainCode, derivationStrategy, isReadOnly = false }) =>
        set({ publicKey, chainCode, derivationStrategy, isReadOnly }),
      setDerivationStrategy: (derivationStrategy) => set({ derivationStrategy }),
      clearWallet: () => set({ publicKey: null, chainCode: null, isReadOnly: false }),
    }),
    {
      name: "wallet-storage",
      partialize: (state) => ({
        network: state.network,
        publicKey: state.publicKey,
        chainCode: state.chainCode,
        derivationStrategy: state.derivationStrategy,
        isReadOnly: state.isReadOnly,
      }),
    }
  )
)
