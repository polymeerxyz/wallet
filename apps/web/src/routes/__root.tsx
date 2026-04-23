import { ThemeProvider, Toaster, TooltipProvider } from "@polymeer/ui"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useEffect } from "react"

import { AnalyticsTracker } from "@/components/analytics-tracker"
import { InitializingOverlay } from "@/components/initializing-overlay"
import { Layout } from "@/components/layout"
import { useCkbWorker } from "@/hooks/use-ckb-worker"
import { useConfigStore } from "@/stores/config.store"

type RouteContext = Record<string, never>

export const Route = createRootRouteWithContext<RouteContext>()({
  component: RootComponent,
})

function RootComponent() {
  const { init } = useCkbWorker()
  const initialized = useConfigStore((s) => s.initialized)

  useEffect(() => {
    if (initialized) {
      return
    }

    init()
  }, [init, initialized])

  return (
    <RootDocument>
      <AnalyticsTracker />
      {!initialized && <InitializingOverlay />}
      <ThemeProvider defaultTheme="light" disableTransitionOnChange>
        <Toaster />
        <TooltipProvider>
          <Layout>
            <Outlet />
          </Layout>
        </TooltipProvider>
      </ThemeProvider>
    </RootDocument>
  )
}

const RootDocument = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <TanStackRouterDevtools position="bottom-right" />
    </>
  )
}
