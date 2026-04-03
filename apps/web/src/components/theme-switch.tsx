import { Moon01Icon, Sun01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, useTheme } from "@polymeer/ui"
import { useEffect, useState } from "react"

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
        <div className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="hover:bg-accent h-9 w-9 rounded-lg transition-colors"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <HugeiconsIcon icon={Sun01Icon} size={18} className="text-zinc-400 group-hover:text-zinc-100" />
      ) : (
        <HugeiconsIcon icon={Moon01Icon} size={18} className="text-zinc-500 group-hover:text-zinc-900" />
      )}
    </Button>
  )
}
