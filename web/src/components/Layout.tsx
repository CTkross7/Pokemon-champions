import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@/store/settings'

const NAV_ITEMS = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/dex', key: 'nav.dex' },
  { to: '/calculator', key: 'nav.calculator' },
  { to: '/teams', key: 'nav.teams' },
  { to: '/about', key: 'nav.about' },
] as const

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-600 text-white'
      : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800',
  ].join(' ')
}

function HeaderControls() {
  const { t } = useTranslation()
  const { theme, language, setTheme, setLanguage } = useSettings()

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label={t('settings.language')}
      >
        {language === 'ko' ? 'EN' : '한국어'}
      </button>
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label={theme === 'dark' ? t('settings.themeLight') : t('settings.themeDark')}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  )
}

export default function Layout() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-brand-600 text-lg font-black text-white">
              C
            </span>
            <span className="text-lg font-bold tracking-tight">{t('app.name')}</span>
          </NavLink>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="main">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={'end' in item && item.end} className={navLinkClass}>
                {t(item.key)}
              </NavLink>
            ))}
          </nav>
          <HeaderControls />
        </div>
        {/* Mobile bottom-style nav row */}
        <nav
          className="flex items-center gap-1 overflow-x-auto border-t border-slate-200 px-2 py-1.5 sm:hidden dark:border-slate-800"
          aria-label="mobile"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={'end' in item && item.end} className={navLinkClass}>
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-6 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t('app.disclaimer')}</p>
        </div>
      </footer>
    </div>
  )
}
