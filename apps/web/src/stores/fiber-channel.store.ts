import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface ForceCloseChannel {
  channelId: string
  localBalance: string
  /** latest_commitment_transaction_hash grabbed before force-close — this is what gets broadcast */
  commitmentTxHash: string
  closedAt: number
  network: "mainnet" | "testnet"
}

interface FiberChannelState {
  forceCloseChannels: ForceCloseChannel[]
  addForceCloseChannel: (record: ForceCloseChannel) => void
  removeForceCloseChannel: (channelId: string, network: "mainnet" | "testnet") => void
}

export const useFiberChannelStore = create<FiberChannelState>()(
  persist(
    (set) => ({
      forceCloseChannels: [],
      addForceCloseChannel: (record) =>
        set((state) => ({
          forceCloseChannels: [
            ...state.forceCloseChannels.filter(
              (r) => !(r.channelId === record.channelId && r.network === record.network)
            ),
            record,
          ],
        })),
      removeForceCloseChannel: (channelId, network) =>
        set((state) => ({
          forceCloseChannels: state.forceCloseChannels.filter(
            (r) => !(r.channelId === channelId && r.network === network)
          ),
        })),
    }),
    {
      name: "fiber-channel-storage",
    }
  )
)
