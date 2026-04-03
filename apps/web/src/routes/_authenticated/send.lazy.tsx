import { createLazyFileRoute } from "@tanstack/react-router"

import { SendPage } from "@/pages/send.page"

export const Route = createLazyFileRoute("/_authenticated/send")({
  component: SendPage,
})
