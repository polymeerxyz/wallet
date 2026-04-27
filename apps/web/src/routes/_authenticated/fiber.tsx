import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/fiber")({
  head: () => ({
    meta: [{ title: "Fiber Network" }],
  }),
})
