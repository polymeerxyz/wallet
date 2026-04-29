import { useEffect, useMemo } from "react"

import { useChannels } from "@/hooks/use-channels"
import { useSettlementCheck } from "@/hooks/use-settlement-check"
import { useConfigStore } from "@/stores/config.store"
import { useFiberChannelStore } from "@/stores/fiber-channel.store"

const SETTLING_STATES = new Set(["shuttingdown", "shutting_down", "closed"])

function isSettlingChannel(stateName?: string): boolean {
  const n =
    stateName
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z_]/g, "") ?? ""
  return SETTLING_STATES.has(n)
}

export function useFiberSettlement() {
  const { channels } = useChannels()
  const network = useConfigStore((s) => s.network)
  const forceCloseChannels = useFiberChannelStore((s) => s.forceCloseChannels)
  const addForceCloseChannel = useFiberChannelStore((s) => s.addForceCloseChannel)
  const { checkingIds, silentCheckAll, checkOne } = useSettlementCheck()

  const pendingSettlement = useMemo(
    () => forceCloseChannels.filter((r) => r.network === network),
    [forceCloseChannels, network]
  )

  // 1. Monitor channels for new force-closes or shutdowns
  useEffect(() => {
    for (const ch of channels) {
      if (isSettlingChannel(ch.state?.state_name) && ch.shutdown_transaction_hash) {
        const alreadyStored = forceCloseChannels.some((r) => r.channelId === ch.channel_id && r.network === network)
        if (!alreadyStored) {
          addForceCloseChannel({
            channelId: ch.channel_id,
            localBalance: ch.local_balance,
            commitmentTxHash: ch.shutdown_transaction_hash,
            closedAt: Date.now(),
            network,
          })
        }
      }
    }
  }, [channels, network, forceCloseChannels, addForceCloseChannel])

  // 2. Perform initial silent check for any already-pending settlements
  useEffect(() => {
    if (pendingSettlement.length > 0) {
      void silentCheckAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    pendingSettlement,
    checkingIds,
    checkOne,
  }
}
