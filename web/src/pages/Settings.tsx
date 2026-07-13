import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettings, type Theme } from '@/store/settings'
import { useAuth } from '@/lib/auth'
import Icon, { type IconName } from '@/components/Icon'

const THEME_OPTIONS: { value: Theme; icon: IconName; labelKey: string }[] = [
  { value: 'light', icon: 'sun', labelKey: 'settings.themeLight' },
  { value: 'dark', icon: 'moon', labelKey: 'settings.themeDark' },
  { value: 'system', icon: 'monitor', labelKey: 'settings.themeSystem' },
]

export default function Settings() {
  const { t } = useTranslation()
  const { theme, language, setTheme, setLanguage } = useSettings()
  const user = useAuth((s) => s.user)

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('settings.subtitle')}</p>
      </div>

      {/* Appearance: theme */}
      <section className="card p-5">
        <h2 className="text-[15px] font-bold">{t('settings.appearance')}</h2>
        <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">{t('settings.themeDesc')}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((opt) => {
            const active = theme === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                aria-pressed={active}
                className={[
                  'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-colors',
                  active
                    ? 'border-volt-500 bg-volt-400/10 text-volt-700 dark:border-volt-400/60 dark:text-volt-300'
                    : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-white/10 dark:text-zinc-400 dark:hover:border-white/20',
                ].join(' ')}
              >
                <Icon name={opt.icon} size={20} />
                {t(opt.labelKey)}
              </button>
            )
          })}
        </div>
      </section>

      {/* Language */}
      <section className="card p-5">
        <h2 className="text-[15px] font-bold">{t('settings.language')}</h2>
        <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">{t('settings.languageDesc')}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(['ko', 'en'] as const).map((lng) => {
            const active = language === lng
            return (
              <button
                key={lng}
                type="button"
                onClick={() => setLanguage(lng)}
                aria-pressed={active}
                className={[
                  'rounded-xl border p-3 text-sm font-bold transition-colors',
                  active
                    ? 'border-volt-500 bg-volt-400/10 text-volt-700 dark:border-volt-400/60 dark:text-volt-300'
                    : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-white/10 dark:text-zinc-400 dark:hover:border-white/20',
                ].join(' ')}
              >
                {lng === 'ko' ? '한국어' : 'English'}
              </button>
            )
          })}
        </div>
      </section>

      {/* Account */}
      <section className="card p-5">
        <h2 className="text-[15px] font-bold">{t('settings.account')}</h2>
        {user ? (
          <Link
            to="/profile"
            className="mt-3 flex items-center gap-3 rounded-xl border border-zinc-200 p-3 transition-colors hover:border-volt-500 dark:border-white/10 dark:hover:border-volt-400/50"
          >
            <span className="grid size-10 place-items-center rounded-full bg-volt-400/15 text-volt-600 dark:text-volt-300">
              <Icon name="user" size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{user.displayName}</span>
              <span className="block truncate text-[12px] text-zinc-500 dark:text-zinc-400">@{user.username}</span>
            </span>
            <Icon name="chevronRight" size={16} className="text-zinc-400" />
          </Link>
        ) : (
          <div className="mt-3">
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('auth.loginPrompt')}</p>
            <Link
              to="/login"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-volt-400 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-volt-300"
            >
              <Icon name="user" size={16} />
              {t('auth.loginCta')}
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
