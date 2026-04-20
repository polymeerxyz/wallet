import { useLocation, useMatches } from "@tanstack/react-router"
import { useEffect } from "react"

declare global {
  interface Window {
    dataLayer: any[]
  }
}

export function AnalyticsTracker() {
  const location = useLocation()
  const matches = useMatches()

  useEffect(() => {
    // The last match in the array is the most specific route
    const lastMatch = matches[matches.length - 1]

    // Extract the title from the meta property if defined as meta: () => [{ title: '...' }]
    // Note: TanStack Router matches contain routeOptions
    const routeOptions = (lastMatch as any)?.routeOptions
    const meta = typeof routeOptions?.meta === "function" ? routeOptions.meta() : []
    const title = (meta as any[])?.find((m) => m.title)?.title || "Polymeer Wallet"

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: "page_view",
      page_path: location.pathname,
      page_title: title,
      page_location: window.location.href,
    })

    console.log(`[Analytics] Tracked page view: ${title} (${location.pathname})`)
  }, [location.pathname, matches])

  return null
}
