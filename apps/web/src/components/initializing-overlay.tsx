export function InitializingOverlay() {
  return (
    <div className="bg-background/80 fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-md">
      <div className="relative flex flex-col items-center gap-8 p-8">
        <div className="bg-primary/10 absolute -top-10 -left-10 h-40 w-40 blur-3xl" />
        <div className="bg-primary/5 absolute -right-10 -bottom-10 h-40 w-40 blur-3xl" />

        <div className="relative flex h-24 w-24 items-center justify-center">
          <img src="/logo-orange.svg" alt="Polymeer Logo" className="h-16 w-16 animate-pulse" />
        </div>

        <div className="flex flex-col items-center gap-3">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight">Polymeer</h2>
          <p className="text-muted-foreground max-w-[280px] text-center text-sm leading-relaxed opacity-80">
            Initializing your secure environment... This may take a few seconds on first load.
          </p>
        </div>
      </div>
    </div>
  )
}
