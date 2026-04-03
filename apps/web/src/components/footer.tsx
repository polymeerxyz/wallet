import { GithubIcon, TwitterIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-border bg-background/50 w-full border-t backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start md:gap-1">
            <h3 className="text-foreground text-lg font-bold tracking-tight">Polymeer Wallet</h3>
            <p className="text-muted-foreground text-sm">A secure and open-source wallet for Nervos CKB.</p>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/polymeerxyz/wallet"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={GithubIcon} size={20} />
            </a>
            <a
              href="https://twitter.com/polymeer"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={TwitterIcon} size={20} />
            </a>
          </div>
        </div>

        <div className="border-border mt-8 flex flex-col items-center justify-between border-t pt-8 md:flex-row">
          <p className="text-muted-foreground text-xs">&copy; {currentYear} Polymeer Labs. All rights reserved.</p>
          <div className="mt-4 flex gap-6 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-foreground text-xs transition-colors">
              Terms
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground text-xs transition-colors">
              Privacy
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground text-xs transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
