export const locales = ["en", "vi", "zh", "zh-TW"] as const

const translations = {
  en: () => import("../assets/locales/en/translation.json"),
  vi: () => import("../assets/locales/vi/translation.json"),
  zh: () => import("../assets/locales/zh/translation.json"),
  "zh-TW": () => import("../assets/locales/zh-TW/translation.json"),
} as const

export default translations
