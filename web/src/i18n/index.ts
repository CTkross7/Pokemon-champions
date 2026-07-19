import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ko from './locales/ko.json'
import en from './locales/en.json'

export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

/**
 * Default language from the device/system locale: Korean only when the system
 * is Korean, English otherwise. Used for first-time visitors; an explicit
 * choice in Settings is persisted and takes precedence.
 */
export function systemLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en'
  const langs = [navigator.language, ...(navigator.languages ?? [])]
  return langs.some((l) => l?.toLowerCase().startsWith('ko')) ? 'ko' : 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
  },
  lng: systemLanguage(),
  fallbackLng: 'en',
  interpolation: {
    // React already escapes rendered strings
    escapeValue: false,
  },
})

export default i18n
