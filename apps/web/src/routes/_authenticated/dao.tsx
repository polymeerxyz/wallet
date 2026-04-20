import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/dao")({
  head: () => ({
    meta: [{ title: "Nervos DAO" }],
  }),
})
