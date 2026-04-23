import { DashboardSquare01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"

import { BlockNumberIndicator } from "./block-number-indicator"
import { Footer } from "./footer"
import { SettingsMenu } from "./settings-menu"
import { SigningDialog } from "./signing-dialog"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="bg-background selection:bg-primary/5 selection:text-primary flex min-h-screen flex-col overflow-x-hidden font-sans antialiased">
      <header className="fixed bottom-6 left-1/2 z-50 w-fit -translate-x-1/2 sm:top-6 sm:bottom-auto">
        <div className="bg-background/80 border-border/40 flex h-14 items-center gap-1 rounded-full border px-2 shadow-2xl ring-1 ring-black/[0.03] backdrop-blur-xl dark:ring-white/[0.03]">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex h-10 w-11 items-center justify-center gap-2 rounded-full text-sm font-bold transition-all sm:w-24"
            activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/20" }}
          >
            <img src="/logo-orange.svg" alt="P" className="h-5 w-5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            to="/dao"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex h-10 w-11 items-center justify-center gap-2 rounded-full text-sm font-bold transition-all sm:w-24"
            activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/20" }}
          >
            <HugeiconsIcon icon={DashboardSquare01Icon} size={18} />
            <span className="hidden sm:inline">DAO</span>
          </Link>

          <SettingsMenu />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 pt-8 pb-12 sm:pt-28">
        <div className="flex w-full max-w-4xl flex-col items-center">
          {children}
          <Footer />
        </div>
      </main>

      <SigningDialog />
      <BlockNumberIndicator />
    </div>
  )
}
