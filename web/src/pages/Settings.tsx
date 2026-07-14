import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettings, type Theme } from '@/store/settings'
import { useAuth } from '@/lib/auth'
import Icon, { type IconName } from '@/components/Icon'

const DEV_EMAIL = 'ctkross.dev@gmail.com'
const BANK_ACCOUNT = '1002-5275-3724'
const APP_VERSION = '1.0.0'

const THEME_OPTIONS: { value: Theme; icon: IconName; labelKey: string }[] = [
  { value: 'light', icon: 'sun', labelKey: 'settings.themeLight' },
  { value: 'dark', icon: 'moon', labelKey: 'settings.themeDark' },
  { value: 'system', icon: 'monitor', labelKey: 'settings.themeSystem' },
]

export default function Settings() {
  const { t } = useTranslation()
  const { theme, language, setTheme, setLanguage } = useSettings()
  const user = useAuth((s) => s.user)
  const [copied, setCopied] = useState<'email' | 'account' | null>(null)

  const copy = async (which: 'email' | 'account', value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(which)
      setTimeout(() => setCopied(null), 2500)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('settings.subtitle')}</p>
      </div>

      {/* Appearance: theme */}
      <Section title={t('settings.appearance')}>
        <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('settings.themeDesc')}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((opt) => (
            <SegButton key={opt.value} active={theme === opt.value} onClick={() => setTheme(opt.value)}>
              <Icon name={opt.icon} size={20} />
              {t(opt.labelKey)}
            </SegButton>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(['ko', 'en'] as const).map((lng) => (
            <SegButton key={lng} active={language === lng} onClick={() => setLanguage(lng)}>
              {lng === 'ko' ? '한국어' : 'English'}
            </SegButton>
          ))}
        </div>
      </Section>

      {/* Account */}
      <Section title={t('settings.account')}>
        <div className="space-y-2">
          {user ? (
            <Row to="/profile" icon="user" label={user.displayName} sub={`@${user.username}`} />
          ) : (
            <Row to="/login" icon="user" label={t('auth.loginCta')} sub={t('auth.loginPrompt')} />
          )}
          {user?.isAdmin && <Row to="/admin" icon="shield" label={t('admin.title')} sub={t('admin.subtitle')} />}
        </div>
      </Section>

      {/* Support / donation — copy bank account number */}
      <Section title={t('settings.support')}>
        <p className="mb-2 text-[12px] text-zinc-500 dark:text-zinc-400">{t('settings.supportDesc')}</p>
        <button
          type="button"
          onClick={() => copy('account', BANK_ACCOUNT)}
          className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left transition-colors hover:border-volt-500 dark:border-white/10 dark:hover:border-volt-400/50"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pink-100 text-pink-600 dark:bg-pink-400/12 dark:text-pink-400">
            <Icon name="heart" size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">{t('settings.bankAccount')}</span>
          </span>
          <span className="shrink-0 text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
            {copied === 'account' ? t('settings.accountCopied') : <Icon name="copy" size={15} />}
          </span>
        </button>
      </Section>

      {/* Contact */}
      <Section title={t('settings.contact')}>
        <p className="mb-2 text-[12px] text-zinc-500 dark:text-zinc-400">{t('settings.contactDesc')}</p>
        <button
          type="button"
          onClick={() => copy('email', DEV_EMAIL)}
          className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left transition-colors hover:border-volt-500 dark:border-white/10 dark:hover:border-volt-400/50"
        >
          <RowIcon icon="mail" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">{t('settings.devEmail')}</span>
            <span className="block truncate text-[12px] text-zinc-500 dark:text-zinc-400">{DEV_EMAIL}</span>
          </span>
          <span className="shrink-0 text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
            {copied === 'email' ? t('settings.emailCopied') : <Icon name="copy" size={15} />}
          </span>
        </button>
      </Section>

      {/* Terms & policies */}
      <Section title={t('settings.policies')}>
        <div className="space-y-2">
          <Row to="/privacy" icon="shield" label={t('settings.privacy')} />
          <Row to="/terms" icon="doc" label={t('settings.terms')} />
          <Row to="/data-sources" icon="doc" label={t('settings.dataSources')} />
        </div>
      </Section>

      {/* Info */}
      <Section title={t('settings.info')}>
        <dl className="space-y-2.5 text-sm">
          <InfoRow label={t('settings.version')} value={`v${APP_VERSION}`} />
          <InfoRow label={t('settings.developer')} value="CTkross" />
          <InfoRow label={t('settings.openSource')} value="PokéAPI · Showdown · Smogon" />
        </dl>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('app.disclaimer')}</p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 text-[13px] font-extrabold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">{title}</h2>
      {children}
    </section>
  )
}

function SegButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-colors',
        active
          ? 'border-volt-500 bg-volt-400/10 text-volt-700 dark:border-volt-400/60 dark:text-volt-300'
          : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-white/10 dark:text-zinc-400 dark:hover:border-white/20',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function RowIcon({ icon }: { icon: IconName }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-white/6 dark:text-zinc-300">
      <Icon name={icon} size={17} />
    </span>
  )
}

interface RowProps {
  icon: IconName
  label: string
  sub?: string
  to?: string
  href?: string
  external?: boolean
}
function Row({ icon, label, sub, to, href, external }: RowProps) {
  const inner = (
    <>
      <RowIcon icon={icon} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{label}</span>
        {sub && <span className="block truncate text-[12px] text-zinc-500 dark:text-zinc-400">{sub}</span>}
      </span>
      <Icon name={external ? 'external' : 'chevronRight'} size={16} className="shrink-0 text-zinc-400" />
    </>
  )
  const cls =
    'flex items-center gap-3 rounded-xl border border-zinc-200 p-3 transition-colors hover:border-volt-500 dark:border-white/10 dark:hover:border-volt-400/50'
  if (href) {
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    )
  }
  return (
    <Link to={to ?? '#'} className={cls}>
      {inner}
    </Link>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2.5 last:border-0 last:pb-0 dark:border-white/6">
      <dt className="font-bold text-zinc-400 dark:text-zinc-500">{label}</dt>
      <dd className="truncate text-right font-semibold">{value}</dd>
    </div>
  )
}
