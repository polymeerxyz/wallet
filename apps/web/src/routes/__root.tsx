import { ThemeProvider, Toaster, TooltipProvider } from "@polymeer/ui"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useEffect, useState } from "react"

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
  const network = useConfigStore((s) => s.network)
  const clientMode = useConfigStore((s) => s.clientMode)
  const ckbWorker = useCkbWorker()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    ckbWorker
      .updateConfig({ network, clientMode })
      .then(() => {
        setIsReady(true)
      })
      .catch(console.error)
  }, [ckbWorker, clientMode, network])

  return (
    <RootDocument>
      <AnalyticsTracker />
      {!isReady ? (
        <InitializingOverlay />
      ) : (
        <ThemeProvider defaultTheme="light" disableTransitionOnChange>
          <Toaster />
          <TooltipProvider>
            <Layout>
              <Outlet />
            </Layout>
          </TooltipProvider>
        </ThemeProvider>
      )}
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
