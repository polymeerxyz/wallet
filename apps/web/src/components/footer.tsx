import { GithubIcon, TwitterIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

const COMMIT_HASH = import.meta.env.VITE_COMMIT_HASH as string | undefined
const SHORT_HASH = COMMIT_HASH?.slice(0, 7)
const COMMIT_URL = COMMIT_HASH
  ? `https://github.com/polymeerxyz/wallet/commit/${COMMIT_HASH}`
  : "https://github.com/polymeerxyz/wallet"

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
            href="https://x.com/polymeer_xyz"
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
          {SHORT_HASH && (
            <a
              href={COMMIT_URL}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground/30 hover:text-primary mt-1 font-mono text-[8px] transition-colors"
            >
              {SHORT_HASH}
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
