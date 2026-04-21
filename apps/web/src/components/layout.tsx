import { DashboardSquare01Icon, Settings01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@polymeer/ui"
import { Link } from "@tanstack/react-router"

import { BlockNumberIndicator } from "./block-number-indicator"
import { Footer } from "./footer"
import { LanguageSelect } from "./language-select"
import { NetworkSwitch } from "./network-switch"
import { NetworkSwitchDialog } from "./network-switch-dialog"
import { SigningDialog } from "./signing-dialog"
import { ThemeSwitch } from "./theme-switch"

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

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-muted/50 h-10 w-11 rounded-full p-0 transition-all active:scale-90 sm:w-24"
              >
                <div className="flex items-center justify-center gap-2">
                  <HugeiconsIcon icon={Settings01Icon} size={18} className="text-muted-foreground" />
                  <span className="hidden text-sm font-bold sm:inline">Settings</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-background/95 w-56 rounded-2xl p-2 shadow-2xl backdrop-blur-xl"
            >
              <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-xs font-bold tracking-wider uppercase">
                Preferences
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="rounded-xl">
                  <span className="flex-1 text-sm font-medium">Network</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-background/95 min-w-[140px] rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
                    <NetworkSwitch />
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="rounded-xl">
                  <span className="flex-1 text-sm font-medium">Language</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-background/95 min-w-[140px] rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
                    <LanguageSelect />
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-sm font-medium">Theme</span>
                <ThemeSwitch />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 pt-8 pb-32 sm:pt-28 sm:pb-8">
        <div className="flex w-full max-w-4xl flex-col items-center">{children}</div>
      </main>

      <Footer />
      <SigningDialog />
      <NetworkSwitchDialog />
      <BlockNumberIndicator />
    </div>
  )
}
