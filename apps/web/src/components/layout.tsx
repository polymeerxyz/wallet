import { Link } from "@tanstack/react-router"

import { Footer } from "./footer"
import { LanguageSelect } from "./language-select"
import { NetworkSwitch } from "./network-switch"
import { ThemeSwitch } from "./theme-switch"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="bg-background selection:bg-primary/5 selection:text-primary flex min-h-screen flex-col font-sans antialiased">
      {/* Header */}
      <header className="border-border/50 sticky top-0 z-50 w-full border-b bg-background/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-10">
            <Link to="/" className="group flex items-center gap-2.5">
              <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-xl transition-all group-hover:drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]">
                <span className="text-secondary font-black text-lg">P</span>
              </div>
              <span className="text-foreground hidden text-xl font-extrabold tracking-tight sm:block">Polymeer</span>
            </Link>
          </div>

          <div className="flex items-center gap-1 bg-muted/30 rounded-2xl p-1 border border-border/20">
            <NetworkSwitch />
            <LanguageSelect />
            <ThemeSwitch />
          </div>
        </div>
      </header>

      {/* Content Container */}
      <main className="flex-1 flex flex-col items-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-4xl flex flex-col items-center">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  )
}
