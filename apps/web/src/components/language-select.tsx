import { Globe02Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { DropdownMenuItem } from "@polymeer/ui"
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
    <>
      {Object.entries(LANGUAGES).map(([key, label]) => (
        <DropdownMenuItem key={key} className="flex items-center justify-between" onClick={() => setLang(key)}>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Globe02Icon} size={14} className="text-muted-foreground/50" />
            <span>{label}</span>
          </div>
          {lang === key && <HugeiconsIcon icon={Tick02Icon} size={14} className="text-emerald-500" />}
        </DropdownMenuItem>
      ))}
    </>
  )
}
