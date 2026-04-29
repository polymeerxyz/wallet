import { BlockNumberIndicator } from "./block-number-indicator"
import { Footer } from "./footer"
import { Header } from "./header"
import { SigningDialog } from "./signing-dialog"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="bg-background selection:bg-primary/5 selection:text-primary flex min-h-screen flex-col overflow-x-hidden font-sans antialiased">
      <Header />

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
