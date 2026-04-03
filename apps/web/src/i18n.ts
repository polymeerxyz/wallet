import { uiTranslations } from "@polymeer/ui"
import type { ReadCallback } from "i18next"
import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import resourcesToBackend from "i18next-resources-to-backend"
import { initReactI18next } from "react-i18next"

import translations, { locales } from "./lib/translation"

const i18nInstance = i18n.createInstance()
i18nInstance
  .use(LanguageDetector)
  .use(
    resourcesToBackend(async (language: string, namespace: string, callback: ReadCallback) => {
      try {
        if (namespace === "ui") {
          const uiLoader = uiTranslations[language as keyof typeof uiTranslations]
          if (!uiLoader) throw new Error(`UI translation for ${language} not found`)

          const uiData = await uiLoader()
          callback(null, uiData.default || uiData)
          return
        }

        const loader = translations[language as keyof typeof translations]
        if (!loader) throw new Error(`Language ${language} not found`)

        const translationModule = await loader()
        callback(null, translationModule.default)
      } catch (e) {
        callback(e as Error, null)
      }
    })
  )
  .use(initReactI18next)

export async function initI18n() {
  if (i18nInstance.isInitialized) return

  await i18nInstance.init({
    supportedLngs: locales,
    ns: ["translation", "ui"],
    defaultNS: "translation",
    load: "languageOnly",
    lng: undefined,
    fallbackLng: "en",
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lng",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  })
}

export default i18nInstance
