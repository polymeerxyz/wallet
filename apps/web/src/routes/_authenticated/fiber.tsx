import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

const searchSchema = z.object({
  tab: z.enum(["channels", "invoices", "peers"]).catch("channels"),
})

export const Route = createFileRoute("/_authenticated/fiber")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Fiber Network" }],
  }),
})
