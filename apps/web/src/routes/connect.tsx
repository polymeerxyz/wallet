import { createFileRoute, redirect } from "@tanstack/react-router"

import { useWalletStore } from "@/stores/wallet.store"

export const Route = createFileRoute("/connect")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      sync: (search.sync as string) || undefined,
      redirect: (search.redirect as string) || undefined,
    }
  },
  beforeLoad: () => {
    const { publicKey, chainCode } = useWalletStore.getState()
    if (publicKey && chainCode) {
      throw redirect({
        to: "/",
      })
    }
  },
})
