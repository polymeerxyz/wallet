import type { ScriptLike } from "@ckb-ccc/core"
import { fixedPointFrom } from "@ckb-ccc/core"
import { useQuery } from "@tanstack/react-query"

import { useWalletStore } from "@/stores/wallet.store"

import { useCkbWorker } from "./use-ckb-worker"

export function useBalance(scripts: ScriptLike[]) {
  const network = useWalletStore((s) => s.network)
  const worker = useCkbWorker()

  return useQuery({
    queryKey: ["ckb-balance", network, scripts.map((s) => s.args).join("-")],
    queryFn: async () => {
      if (scripts.length === 0) return fixedPointFrom(0)

      const balanceStr = await worker.getBalance(scripts)
      return fixedPointFrom(BigInt(balanceStr))
    },
    enabled: scripts.length > 0,
  })
}
