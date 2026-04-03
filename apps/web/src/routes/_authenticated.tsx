import { createFileRoute, redirect } from "@tanstack/react-router"

import { useWalletStore } from "@/stores/wallet.store"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => {
    const { publicKey, chainCode } = useWalletStore.getState()
    if (!publicKey || !chainCode) {
      throw redirect({
        to: "/connect",
        search: {
          redirect: location.href,
          sync: undefined,
        },
      })
    }
  },
})
