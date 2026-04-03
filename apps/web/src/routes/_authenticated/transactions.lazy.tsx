import { createLazyFileRoute } from "@tanstack/react-router"

import { TransactionPage } from "@/pages/transaction.page"

export const Route = createLazyFileRoute("/_authenticated/transactions")({
  component: TransactionPage,
})
