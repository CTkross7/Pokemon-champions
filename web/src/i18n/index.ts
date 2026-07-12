import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ko from './locales/ko.json'
import en from './locales/en.json'

export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
  },
  lng: 'ko',
  fallbackLng: 'ko',
  interpolation: {
    // React already escapes rendered strings
    escapeValue: false,
  },
})

export default i18n
