import { ClientPublicMainnet, ClientPublicTestnet } from "@ckb-ccc/core"
import { useMemo } from "react"

import { useWalletStore } from "@/stores/wallet.store"

export function useCkbClient() {
  const network = useWalletStore((state) => state.network)

  return useMemo(
    () => (network === "mainnet" ? new ClientPublicMainnet() : new ClientPublicTestnet()),
    [network]
  )
}
