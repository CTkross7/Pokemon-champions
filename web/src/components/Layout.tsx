import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@/store/settings'
import Icon, { type IconName } from '@/components/Icon'
import Logo from '@/components/Logo'

const NAV_ITEMS: ReadonlyArray<{ to: string; key: string; icon: IconName; end?: boolean; tab?: boolean }> = [
  { to: '/', key: 'nav.home', icon: 'home', end: true, tab: true },
  { to: '/dex', key: 'nav.dex', icon: 'book', tab: true },
  { to: '/calculator', key: 'nav.calculator', icon: 'calc', tab: true },
  { to: '/teams', key: 'nav.teams', icon: 'users', tab: true },
  { to: '/matchup', key: 'nav.matchup', icon: 'zap', tab: true },
  { to: '/gallery', key: 'nav.gallery', icon: 'sparkles', tab: false },
  { to: '/about', key: 'nav.about', icon: 'info', tab: false },
]

const TAB_ITEMS = NAV_ITEMS.filter((i) => i.tab)

function HeaderControls() {
  const { t } = useTranslation()
  const { theme, language, setTheme, setLanguage } = useSettings()

  const buttonClass =
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-3 text-xs font-semibold text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-white/20 dark:hover:text-white'

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

const TITLE_BY_PATH: Record<string, string> = {
  '/': 'home',
  '/dex': 'dex',
  '/calculator': 'calculator',
  '/teams': 'teams',
  '/matchup': 'matchup',
  '/gallery': 'gallery',
  '/about': 'about',
}

export default function Layout() {
  const { t } = useTranslation()
  const location = useLocation()

  // Per-route document title for SEO / shareable tabs.
  useEffect(() => {
    const base = location.pathname.startsWith('/dex/') ? 'dex' : TITLE_BY_PATH[location.pathname]
    const appName = t('app.name')
    document.title = base ? `${t(`nav.${base}`)} · ${appName}` : `${appName} — ${t('app.tagline')}`
  }, [location.pathname, t])

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/75 backdrop-blur-xl dark:border-white/6 dark:bg-surface-dark/75">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[17px] font-extrabold tracking-tight">{t('app.name')}</span>
          </NavLink>

          {/* Desktop nav */}
          <nav
            className="hidden items-center gap-1 rounded-full border border-zinc-200/70 bg-white/60 p-1 sm:flex dark:border-white/8 dark:bg-white/4"
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
                      ? 'bg-zinc-900 text-white shadow-soft dark:bg-volt-400 dark:text-black'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
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

      <footer className="mb-20 border-t border-zinc-200/70 py-6 sm:mb-0 dark:border-white/6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            <Logo size={16} />
            {t('app.name')} · {t('app.tagline')}
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>{t('app.developedBy', { name: 'CTkross' })}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">{t('app.disclaimer')}</p>
          <div className="flex gap-3 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
            <NavLink to="/about" className="hover:text-zinc-700 dark:hover:text-zinc-300">
              {t('nav.about')}
            </NavLink>
            <NavLink to="/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-300">
              {t('nav.privacy')}
            </NavLink>
          </div>
        </div>
      </footer>

      {/* Mobile bottom tab bar (native-app style) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/70 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden dark:border-white/8 dark:bg-surface-dark/85"
        aria-label="mobile"
      >
        <div className="grid grid-cols-5">
          {TAB_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 pt-2.5 pb-2 text-[10px] font-semibold transition-colors',
                  isActive ? 'text-black dark:text-volt-400' : 'text-zinc-400 dark:text-zinc-600',
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
