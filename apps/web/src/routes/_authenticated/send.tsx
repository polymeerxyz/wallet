import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/send")({
  head: () => ({
    meta: [{ title: "Send Assets" }],
  }),
})
