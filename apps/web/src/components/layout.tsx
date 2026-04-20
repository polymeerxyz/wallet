import { Link } from "@tanstack/react-router"

import { BlockNumberIndicator } from "./block-number-indicator"
import { Footer } from "./footer"
import { LanguageSelect } from "./language-select"
import { NetworkSwitch } from "./network-switch"
import { SigningDialog } from "./signing-dialog"
import { ThemeSwitch } from "./theme-switch"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="bg-background selection:bg-primary/5 selection:text-primary flex min-h-screen flex-col font-sans antialiased">
      <header className="border-border/40 bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center">
            <Link to="/" className="group flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="Polymeer Logo"
                className="shadow-primary/20 h-9 w-9 p-1 rounded-xl transition-all group-active:scale-95"
              />
              <span className="text-foreground hidden text-lg font-bold sm:block">Polymeer</span>
            </Link>
            <nav className="ml-10 hidden items-center gap-8 md:flex">
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground text-tiny font-semibold transition-colors"
                activeProps={{ className: "text-foreground" }}
              >
                Overview
              </Link>
              <Link
                to="/dao"
                className="text-muted-foreground hover:text-foreground text-tiny font-semibold transition-colors"
                activeProps={{ className: "text-foreground" }}
              >
                DAO
              </Link>
            </nav>
          </div>

          <div className="bg-muted/10 border-border/20 flex items-center gap-1 rounded-xl border p-1 backdrop-blur-sm">
            <NetworkSwitch />
            <div className="bg-border/20 mx-1 h-4 w-[1px]" />
            <LanguageSelect />
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-4 lg:py-8">
        <div className="flex w-full max-w-4xl flex-col items-center">{children}</div>
      </main>

      <Footer />
      <SigningDialog />
      <BlockNumberIndicator />
    </div>
  )
}
