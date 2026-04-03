import { createLazyFileRoute } from "@tanstack/react-router"

import { OverviewPage } from "@/pages/overview.page"

export const Route = createLazyFileRoute("/_authenticated/")({
  component: OverviewPage,
})
