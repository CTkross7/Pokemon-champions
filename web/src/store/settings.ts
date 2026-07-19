import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n, { systemLanguage, type Language } from '@/i18n'

// 'system' follows the OS preference via matchMedia; 'dark'/'light' force it.
export type Theme = 'dark' | 'light' | 'system'

interface SettingsState {
  theme: Theme
  language: Language
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
}

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches

/** Resolves the effective dark/light for a theme setting and applies it. */
function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && prefersDark())
  document.documentElement.classList.toggle('dark', dark)
}

// When the OS theme flips and the user is on 'system', re-apply live.
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useSettings.getState().theme === 'system') applyTheme('system')
  })
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      // First-time default follows the system locale (ko only if the device is
      // Korean, else en). A persisted choice from Settings overrides this.
      language: systemLanguage(),
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
      name: 'champsnote-settings',
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
