import { ThemeProvider, Toaster, TooltipProvider } from "@polymeer/ui"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

type RouteContext = Record<string, never>

export const Route = createRootRouteWithContext<RouteContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <ThemeProvider defaultTheme="system" disableTransitionOnChange>
        <Toaster />
        <TooltipProvider>
          <Outlet />
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
