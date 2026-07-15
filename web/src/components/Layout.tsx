import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@/store/settings'
import { useTeams } from '@/store/teams'
import { useAuth } from '@/lib/auth'
import { useAnnounce, unreadNotices } from '@/store/announce'
import Icon, { type IconName } from '@/components/Icon'
import Logo from '@/components/Logo'
import AdSlot from '@/components/AdSlot'
import UpdateBanner from '@/components/UpdateBanner'
import AnnouncePopup from '@/components/AnnouncePopup'
import { AD_BANNER_SLOT } from '@/lib/ads'

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches

const NAV_ITEMS: ReadonlyArray<{ to: string; key: string; icon: IconName; end?: boolean; tab?: boolean }> = [
  { to: '/', key: 'nav.home', icon: 'home', end: true, tab: true },
  { to: '/dex', key: 'nav.dex', icon: 'book', tab: true },
  { to: '/calculator', key: 'nav.calculator', icon: 'calc', tab: true },
  { to: '/teams', key: 'nav.teams', icon: 'users', tab: true },
  { to: '/matchup', key: 'nav.matchup', icon: 'zap', tab: true },
  { to: '/gallery', key: 'nav.gallery', icon: 'sparkles', tab: true },
  { to: '/notices', key: 'nav.notices', icon: 'bell', tab: false },
  { to: '/about', key: 'nav.about', icon: 'info', tab: false },
]

const TAB_ITEMS = NAV_ITEMS.filter((i) => i.tab)

function HeaderControls() {
  const { t } = useTranslation()
  const { theme, language, setTheme, setLanguage } = useSettings()
  const user = useAuth((s) => s.user)

  // Quick toggle flips light↔dark from the effective theme (never sets 'system';
  // the 3-way choice, including System, lives on the Settings page).
  const effectiveDark = theme === 'dark' || (theme === 'system' && prefersDark())

  const buttonClass =
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white/70 px-3 text-xs font-semibold text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-white/20 dark:hover:text-white'
  const iconButton = `${buttonClass} w-9 px-0`

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
        onClick={() => setTheme(effectiveDark ? 'light' : 'dark')}
        className={iconButton}
        aria-label={effectiveDark ? t('settings.themeLight') : t('settings.themeDark')}
      >
        <Icon name={effectiveDark ? 'sun' : 'moon'} size={16} />
      </button>
      <Link to="/settings" className={iconButton} aria-label={t('settings.title')}>
        <Icon name="settings" size={16} />
      </Link>
      <Link
        to={user ? '/profile' : '/login'}
        className={iconButton}
        aria-label={user ? t('auth.profile') : t('auth.login')}
      >
        <Icon name="user" size={16} />
      </Link>
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
  '/notices': 'notices',
  '/about': 'about',
  '/settings': 'settings',
  '/profile': 'profile',
  '/login': 'login',
}

export default function Layout() {
  const { t } = useTranslation()
  const location = useLocation()
  const initAuth = useAuth((s) => s.init)
  const user = useAuth((s) => s.user)
  const [moreOpen, setMoreOpen] = useState(false)

  // Unread-notice badge: only for signed-in users (guests never see the dot /
  // popup, to keep the logged-out path error-free).
  const notices = useAnnounce((s) => s.notices)
  const lastReadNoticeAt = useAnnounce((s) => s.lastReadNoticeAt)
  const refreshNotices = useAnnounce((s) => s.refresh)
  const markNoticesRead = useAnnounce((s) => s.markRead)
  const hasUnread = Boolean(user) && unreadNotices({ notices, lastReadNoticeAt }).length > 0

  // Resolve the current session (or fall back to a persisted local account).
  useEffect(() => {
    void initAuth()
  }, [initAuth])

  // Pull the notice board once on mount so the dot / popup can evaluate.
  useEffect(() => {
    void refreshNotices()
  }, [refreshNotices])

  // Opening the notices tab clears the unread marker (they've now seen them).
  // Refresh first so a notice posted after mount is still counted as read.
  useEffect(() => {
    if (location.pathname === '/notices') void refreshNotices().then(markNoticesRead)
  }, [location.pathname, refreshNotices, markNoticesRead])

  // Once signed in, merge cloud-saved teams so a fresh device / re-login keeps
  // everything the user built.
  useEffect(() => {
    if (user) void useTeams.getState().syncFromCloud()
  }, [user])

  // Close the mobile "더보기" sheet whenever the route changes.
  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  // Reset scroll to the top on every route change — otherwise switching tabs
  // after scrolling leaves the new page scrolled down to the old offset.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Per-route document title for SEO / shareable tabs.
  useEffect(() => {
    const base = location.pathname.startsWith('/dex/') ? 'dex' : TITLE_BY_PATH[location.pathname]
    const appName = t('app.name')
    document.title = base ? `${t(`nav.${base}`)} · ${appName}` : `${appName} — ${t('app.tagline')}`
  }, [location.pathname, t])

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/95 dark:border-white/6 dark:bg-surface-dark/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[17px] font-extrabold tracking-tight">{t('app.name')}</span>
          </NavLink>

          {/* Desktop nav */}
          <nav
            className="hidden items-center gap-1 rounded-full border border-zinc-200/70 bg-white/60 p-1 lg:flex dark:border-white/8 dark:bg-white/4"
            aria-label="main"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'relative rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-volt-400 text-black shadow-soft dark:bg-volt-400 dark:text-black'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
                  ].join(' ')
                }
              >
                {t(item.key)}
                {item.to === '/notices' && hasUnread && (
                  <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-surface-dark" />
                )}
              </NavLink>
            ))}
          </nav>

          <HeaderControls />
        </div>
      </header>

      {/* No per-route transform animation here: promoting the whole (tall)
          <main> to a compositing layer on every navigation caused tiles to fail
          to raster on some Android WebViews — the About feature grid rendered
          blank/noisy. Plain repaint is reliable across GPUs. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 sm:pb-10">
        <Outlet />
      </main>

      {/* Bottom banner ad — renders only when AdSense is configured. */}
      {AD_BANNER_SLOT && (
        <div className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 sm:pb-4">
          <AdSlot slot={AD_BANNER_SLOT} />
        </div>
      )}

      <footer className="mb-20 border-t border-zinc-200/70 py-6 lg:mb-0 dark:border-white/6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            <Logo size={16} />
            {t('app.name')} · {t('app.tagline')}
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>{t('app.developedBy', { name: 'CTkross' })}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">{t('app.disclaimer')}</p>
          <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
            <NavLink to="/notices" className="hover:text-zinc-700 dark:hover:text-zinc-300">
              {t('nav.notices')}
            </NavLink>
            <NavLink to="/about" className="hover:text-zinc-700 dark:hover:text-zinc-300">
              {t('nav.about')}
            </NavLink>
            <NavLink to="/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-300">
              {t('nav.privacy')}
            </NavLink>
          </div>
        </div>
      </footer>

      {/* Mobile "더보기" sheet — profile + settings + secondary destinations */}
      {moreOpen && (
        <MoreSheet
          onClose={() => setMoreOpen(false)}
          loggedIn={Boolean(user)}
          isAdmin={Boolean(user?.isAdmin)}
          noticeUnread={hasUnread}
        />
      )}

      {/* New-notice / patch-note popup + live app-update prompt */}
      <AnnouncePopup />
      <UpdateBanner />

      {/* Mobile bottom tab bar (native-app style) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/70 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-white/8 dark:bg-surface-dark"
        aria-label="mobile"
      >
        <div className="grid" style={{ gridTemplateColumns: `repeat(${TAB_ITEMS.length + 1}, minmax(0, 1fr))` }}>
          {TAB_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'relative flex flex-col items-center gap-1 pt-3 pb-2 text-[10px] font-semibold transition-colors',
                  isActive ? 'text-volt-600 dark:text-volt-400' : 'text-zinc-400 dark:text-zinc-600',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-volt-500 dark:bg-volt-400" />
                  )}
                  <Icon name={item.icon} size={21} />
                  {t(item.key)}
                </>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={[
              'relative flex flex-col items-center gap-1 pt-3 pb-2 text-[10px] font-semibold transition-colors',
              moreOpen ? 'text-volt-600 dark:text-volt-400' : 'text-zinc-400 dark:text-zinc-600',
            ].join(' ')}
            aria-expanded={moreOpen}
          >
            {hasUnread && (
              <span className="absolute top-2 right-1/2 mr-[-14px] h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-surface-dark" />
            )}
            <Icon name="grid" size={21} />
            {t('nav.more')}
          </button>
        </div>
      </nav>
    </div>
  )
}

/** Bottom sheet of secondary destinations (mobile). Profile + Settings first,
 *  since those are the shortcuts users reach for most from a tab bar. */
function MoreSheet({
  onClose,
  loggedIn,
  isAdmin,
  noticeUnread,
}: {
  onClose: () => void
  loggedIn: boolean
  isAdmin: boolean
  noticeUnread: boolean
}) {
  const { t } = useTranslation()
  const items: ReadonlyArray<{ to: string; key: string; icon: IconName }> = [
    { to: loggedIn ? '/profile' : '/login', key: loggedIn ? 'nav.profile' : 'auth.login', icon: 'user' },
    { to: '/settings', key: 'nav.settings', icon: 'settings' },
    { to: '/stats', key: 'nav.stats', icon: 'chart' },
    { to: '/notices', key: 'nav.notices', icon: 'bell' },
    { to: '/about', key: 'nav.about', icon: 'info' },
    // Admin dashboard only surfaces for verified admins (ADMIN_USERNAMES).
    ...(isAdmin ? [{ to: '/admin', key: 'nav.admin', icon: 'shield' as IconName }] : []),
  ]
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label={t('report.close')} onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-zinc-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-surface-dark">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-300 dark:bg-white/15" />
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="relative flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 py-4 text-xs font-bold text-zinc-600 transition-colors hover:border-volt-500 hover:text-volt-700 dark:border-white/10 dark:text-zinc-300 dark:hover:border-volt-400/60 dark:hover:text-volt-300"
            >
              {item.to === '/notices' && noticeUnread && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500" />
              )}
              <Icon name={item.icon} size={22} />
              {t(item.key)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
