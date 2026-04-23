import { GithubIcon, TwitterIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export function Footer() {
  return (
    <footer className="mt-auto w-full py-12">
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/polymeerxyz/wallet"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground/30 hover:text-primary transition-colors"
            title="GitHub"
          >
            <HugeiconsIcon icon={GithubIcon} size={20} />
          </a>
          <a
            href="https://x.com/"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground/30 hover:text-primary transition-colors"
            title="Twitter"
          >
            <HugeiconsIcon icon={TwitterIcon} size={20} />
          </a>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-muted-foreground/60 text-[10px] font-bold tracking-[0.3em] uppercase">Polymeer Wallet</p>
          <p className="text-muted-foreground/50 text-[8px] font-medium tracking-widest uppercase">
            Open Source · Nervos CKB
          </p>
        </div>
      </div>
    </footer>
  )
}
