export const uiTranslations = {
  en: () => import("./locales/en.json"),
  vi: () => import("./locales/vi.json"),
  zh: () => import("./locales/zh.json"),
  "zh-TW": () => import("./locales/zh-TW.json"),
} as const
