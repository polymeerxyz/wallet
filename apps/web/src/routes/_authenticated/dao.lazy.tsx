import { createLazyFileRoute } from "@tanstack/react-router"

import { DaoPage } from "@/pages/dao.page"

export const Route = createLazyFileRoute("/_authenticated/dao")({
  component: DaoPage,
})
