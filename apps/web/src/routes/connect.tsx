import { createFileRoute, redirect } from "@tanstack/react-router"

import { ConnectPage } from "@/pages/connect.page"
import { useWalletStore } from "@/stores/wallet.store"

export const Route = createFileRoute("/connect")({
  beforeLoad: () => {
    const { publicKey, chainCode } = useWalletStore.getState()
    if (publicKey && chainCode) {
      throw redirect({
        to: "/",
      })
    }
  },
  component: ConnectPage,
})
