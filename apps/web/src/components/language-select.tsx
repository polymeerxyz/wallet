import { Globe02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@polymeer/ui"
import { useState } from "react"

const LANGUAGES: Record<string, string> = {
  en: "English",
  vi: "Tiếng Việt",
  zh: "中文",
  "zh-TW": "繁體中文",
}

export function LanguageSelect() {
  const [lang, setLang] = useState("en")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-background/80 h-9 gap-2 rounded-xl border-none px-3 shadow-none"
        >
          <HugeiconsIcon icon={Globe02Icon} size={14} className="text-muted-foreground" />
          <span className="text-xs font-bold tracking-wider uppercase">{lang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {Object.entries(LANGUAGES).map(([key, label]) => (
          <DropdownMenuItem key={key} className="flex items-center justify-between" onClick={() => setLang(key)}>
            {label}
            {lang === key && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
