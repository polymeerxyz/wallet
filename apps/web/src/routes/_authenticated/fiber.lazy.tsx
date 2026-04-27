import { createLazyFileRoute } from "@tanstack/react-router"

import { FiberPage } from "@/pages/fiber.page"

export const Route = createLazyFileRoute("/_authenticated/fiber")({
  component: FiberPage,
})
