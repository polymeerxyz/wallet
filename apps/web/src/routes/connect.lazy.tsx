import { createLazyFileRoute } from "@tanstack/react-router"

import { ConnectPage } from "@/pages/connect.page"

export const Route = createLazyFileRoute("/connect")({
  component: ConnectPage,
})
