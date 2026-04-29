import { Link01Icon, SafeIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"

import { useConfigStore } from "@/stores/config.store"

import { SettingsMenu } from "./settings-menu"

export function Header() {
  const network = useConfigStore((s) => s.network)
  return (
    <header className="fixed bottom-6 left-1/2 z-50 w-fit -translate-x-1/2 sm:top-6 sm:bottom-auto">
      <div className="bg-background/80 border-border/40 flex h-14 items-center gap-1 rounded-full border px-2 shadow-md backdrop-blur-xl">
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
          <HugeiconsIcon icon={SafeIcon} size={18} />
          <span className="hidden sm:inline">DAO</span>
        </Link>
        {network === "testnet" && (
          <Link
            to="/fiber"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex h-10 w-11 items-center justify-center gap-2 rounded-full text-sm font-bold transition-all sm:w-24"
            activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/20" }}
          >
            <HugeiconsIcon icon={Link01Icon} size={18} />
            <span className="hidden sm:inline">Fiber</span>
          </Link>
        )}
        <SettingsMenu />
      </div>
    </header>
  )
}
