import { createLazyFileRoute, Navigate } from "@tanstack/react-router"

const Page = () => {
  return <Navigate to="/" replace />
}

export const Route = createLazyFileRoute("/_authenticated/")({
  component: Page,
})
