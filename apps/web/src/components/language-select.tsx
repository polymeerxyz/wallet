import { Globe02Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, cn, DropdownMenuItem, useIsMobile } from "@polymeer/ui"
import { useState } from "react"

const LANGUAGES: Record<string, string> = {
  en: "English",
  vi: "Tiếng Việt",
  zh: "中文",
  "zh-TW": "繁體",
}

export function LanguageSelect() {
  const [lang, setLang] = useState("en")
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(LANGUAGES).map(([key, label]) => (
          <Button
            key={key}
            variant={lang === key ? "default" : "outline"}
            size="sm"
            className={cn("h-8 rounded-xl px-3 text-xs font-bold transition-all", lang !== key && "bg-muted/30")}
            onClick={() => setLang(key)}
          >
            {label}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <>
      {Object.entries(LANGUAGES).map(([key, label]) => (
        <DropdownMenuItem
          key={key}
          className="flex items-center justify-between rounded-xl px-3 py-2"
          onClick={() => setLang(key)}
        >
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Globe02Icon} size={14} className="text-muted-foreground/50" />
            <span className="text-sm font-medium">{label}</span>
          </div>
          {lang === key && <HugeiconsIcon icon={Tick02Icon} size={14} className="text-emerald-500" />}
        </DropdownMenuItem>
      ))}
    </>
  )
}
