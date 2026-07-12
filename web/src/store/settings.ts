import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n, { type Language } from '@/i18n'

export type Theme = 'dark' | 'light'

interface SettingsState {
  theme: Theme
  language: Language
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'ko',
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
      setLanguage: (language) => {
        void i18n.changeLanguage(language)
        set({ language })
      },
    }),
    {
      name: 'champmate-settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme)
          void i18n.changeLanguage(state.language)
        }
      },
    },
  ),
)

// Apply defaults on first load (before any user interaction)
applyTheme(useSettings.getState().theme)
void i18n.changeLanguage(useSettings.getState().language)
