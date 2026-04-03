import { GithubIcon, TwitterIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start md:gap-1">
            <h3 className="text-lg font-bold tracking-tight text-foreground">Polymeer Wallet</h3>
            <p className="text-sm text-muted-foreground">
              A secure and open-source wallet for Nervos CKB.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/polymeerxyz/wallet"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <HugeiconsIcon icon={GithubIcon} size={20} />
            </a>
            <a
              href="https://twitter.com/polymeer"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <HugeiconsIcon icon={TwitterIcon} size={20} />
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Polymeer Labs. All rights reserved.
          </p>
          <div className="mt-4 flex gap-6 md:mt-0">
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Terms
            </a>
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
