import { useQuery } from "@tanstack/react-query"

import { useConfigStore } from "@/stores/config.store"
import { useWalletStore, WalletDerivationStrategy } from "@/stores/wallet.store"

import { useCkbWorker } from "./use-ckb-worker"

export function useAddress() {
  const publicKey = useWalletStore((s) => s.publicKey)
  const chainCode = useWalletStore((s) => s.chainCode)
  const derivationStrategy = useWalletStore((s) => s.derivationStrategy)
  const network = useConfigStore((s) => s.network)
  const clientMode = useConfigStore((s) => s.clientMode)
  const worker = useCkbWorker()

  const query = useQuery({
    queryKey: ["ckb-address", network, clientMode, publicKey, chainCode, derivationStrategy],
    queryFn: async () => {
      if (!publicKey || !chainCode) {
        return { address: null, scripts: [] }
      }

      if (derivationStrategy === WalletDerivationStrategy.UTXO_BASED) {
        const res = await worker.scanUtxoWallet(publicKey, chainCode, 20)
        return { address: res.latestUnusedAddress, scripts: res.scripts }
      } else {
        const isAccountBased = derivationStrategy === WalletDerivationStrategy.ACCOUNT_BASED
        return await worker.getSingleAddress(publicKey, chainCode, isAccountBased)
      }
    },
    enabled: !!publicKey && !!chainCode,
  })

  return {
    address: query.data?.address || null,
    scripts: query.data?.scripts.map((s) => s.script) || [],
    scriptsWithPaths: query.data?.scripts || [],
    isLoading: query.isLoading,
    error: query.error,
  }
}
