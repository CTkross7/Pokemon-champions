import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@/store/settings'
import Icon, { type IconName } from '@/components/Icon'
import Logo from '@/components/Logo'

const NAV_ITEMS: ReadonlyArray<{ to: string; key: string; icon: IconName; end?: boolean }> = [
  { to: '/', key: 'nav.home', icon: 'home', end: true },
  { to: '/dex', key: 'nav.dex', icon: 'book' },
  { to: '/calculator', key: 'nav.calculator', icon: 'calc' },
  { to: '/teams', key: 'nav.teams', icon: 'users' },
  { to: '/about', key: 'nav.about', icon: 'info' },
]

function HeaderControls() {
  const { t } = useTranslation()
  const { theme, language, setTheme, setLanguage } = useSettings()

  const buttonClass =
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white'

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
        className={buttonClass}
        aria-label={t('settings.language')}
      >
        <Icon name="globe" size={15} />
        {language === 'ko' ? 'EN' : '한국어'}
      </button>
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className={`${buttonClass} w-9 px-0`}
        aria-label={theme === 'dark' ? t('settings.themeLight') : t('settings.themeDark')}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
      </button>
    </div>
  )
}

export default function Layout() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl dark:border-white/6 dark:bg-surface-dark/75">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[17px] font-extrabold tracking-tight">{t('app.name')}</span>
          </NavLink>

          {/* Desktop nav */}
          <nav
            className="hidden items-center gap-1 rounded-full border border-slate-200/70 bg-white/60 p-1 sm:flex dark:border-white/8 dark:bg-white/4"
            aria-label="main"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-slate-900 text-white shadow-soft dark:bg-white dark:text-slate-900'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                  ].join(' ')
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <HeaderControls />
        </div>
      </header>

      <main
        key={location.pathname}
        className="mx-auto w-full max-w-6xl flex-1 animate-fade-up px-4 pt-6 pb-28 sm:px-6 sm:pb-10"
      >
        <Outlet />
      </main>

      <footer className="mb-20 border-t border-slate-200/70 py-6 sm:mb-0 dark:border-white/6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
            <Logo size={16} />
            {t('app.name')} · {t('app.tagline')}
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">{t('app.disclaimer')}</p>
        </div>
      </footer>

      {/* Mobile bottom tab bar (native-app style) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden dark:border-white/8 dark:bg-surface-dark/85"
        aria-label="mobile"
      >
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 pt-2.5 pb-2 text-[10px] font-semibold transition-colors',
                  isActive ? 'text-black dark:text-white' : 'text-slate-400 dark:text-slate-600',
                ].join(' ')
              }
            >
              <Icon name={item.icon} size={21} />
              {t(item.key)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
