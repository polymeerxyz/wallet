import type { ScriptLike } from "@ckb-ccc/core"
import { fixedPointFrom, Script } from "@ckb-ccc/core"
import { useQueries, useQuery } from "@tanstack/react-query"

import { useConfigStore } from "@/stores/config.store"

import { useCkbWorker } from "./use-ckb-worker"

export function useBalance(scripts: ScriptLike[]) {
  const network = useConfigStore((s) => s.network)
  const clientMode = useConfigStore((s) => s.clientMode)
  const worker = useCkbWorker()

  return useQuery({
    queryKey: ["ckb-balance", network, clientMode, scripts.map((s) => Script.from(s).hash()).join("-")],
    queryFn: async () => {
      if (scripts.length === 0) return fixedPointFrom(0)

      const balanceStr = await worker.getBalance(scripts)
      return fixedPointFrom(BigInt(balanceStr))
    },
    enabled: scripts.length > 0,
  })
}

export function useBalances(scriptsWithPaths: { script: ScriptLike; path: string }[]) {
  const network = useConfigStore((s) => s.network)
  const clientMode = useConfigStore((s) => s.clientMode)
  const worker = useCkbWorker()

  return useQueries({
    queries: scriptsWithPaths.map(({ script, path }) => ({
      queryKey: ["ckb-balance", network, clientMode, Script.from(script).hash(), path],
      queryFn: async () => {
        const balanceStr = await worker.getBalance([script])
        return fixedPointFrom(BigInt(balanceStr))
      },
      enabled: !!script,
    })),
  })
}
