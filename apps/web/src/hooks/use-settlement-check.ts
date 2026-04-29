import { useCallback, useState } from "react"
import { toast } from "sonner"

import { useCkbWorker } from "@/hooks/use-ckb-worker"
import { useConfigStore } from "@/stores/config.store"
import { useFiberChannelStore } from "@/stores/fiber-channel.store"

async function checkCommitmentCell(
  ckbWorker: ReturnType<typeof useCkbWorker>,
  commitmentTxHash: string
): Promise<boolean> {
  const cell = await ckbWorker.getCell(commitmentTxHash, 0)
  return cell === null
}

export function useSettlementCheck() {
  const ckbWorker = useCkbWorker()
  const network = useConfigStore((s) => s.network)
  const forceCloseChannels = useFiberChannelStore((s) => s.forceCloseChannels)
  const removeForceCloseChannel = useFiberChannelStore((s) => s.removeForceCloseChannel)

  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set())

  const silentCheckAll = useCallback(async () => {
    const pending = forceCloseChannels.filter((r) => r.network === network)
    for (const record of pending) {
      try {
        const settled = await checkCommitmentCell(ckbWorker, record.commitmentTxHash)
        if (settled) {
          removeForceCloseChannel(record.channelId, network)
        }
      } catch {
        // Ignore fetch errors
      }
    }
  }, [forceCloseChannels, ckbWorker, network, removeForceCloseChannel])

  const checkOne = useCallback(
    async (channelId: string, commitmentTxHash: string) => {
      setCheckingIds((prev) => new Set(prev).add(channelId))
      try {
        const settled = await checkCommitmentCell(ckbWorker, commitmentTxHash)
        if (settled) {
          removeForceCloseChannel(channelId, network)
          toast.success("Settlement complete! Your CKB has been returned to your wallet.")
        } else {
          toast.info(
            "Commitment cell is still live. Keep the wallet tab open — the Fiber node will settle automatically."
          )
        }
      } catch {
        toast.error("Failed to query chain. Check your connection.")
      } finally {
        setCheckingIds((prev) => {
          const next = new Set(prev)
          next.delete(channelId)
          return next
        })
      }
    },
    [ckbWorker, network, removeForceCloseChannel]
  )

  return { checkingIds, silentCheckAll, checkOne }
}
