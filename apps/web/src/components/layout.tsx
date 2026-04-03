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
      <header className="border-border bg-background/50 sticky top-0 z-50 w-full border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center">
            <Link to="/" className="group flex items-center gap-2.5">
              <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-lg transition-all">
                <span className="text-secondary text-lg font-black tracking-tighter">P</span>
              </div>
              <span className="text-foreground hidden text-xl font-extrabold tracking-tight sm:block">Polymeer</span>
            </Link>
            <nav className="ml-8 hidden items-center gap-6 md:flex">
              <Link
                to="/dao"
                className="text-muted-foreground hover:text-foreground text-sm font-bold tracking-tight transition-colors"
                activeProps={{ className: "text-foreground" }}
              >
                DAO
              </Link>
            </nav>
          </div>

          <div className="bg-muted/20 flex items-center gap-1 rounded-xl p-1">
            <NetworkSwitch />
            <LanguageSelect />
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-12 lg:py-20">
        <div className="flex w-full max-w-4xl flex-col items-center">{children}</div>
      </main>

      <Footer />
      <SigningDialog />
      <BlockNumberIndicator />
    </div>
  )
}
