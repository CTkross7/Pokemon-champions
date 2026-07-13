import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, type Provider } from '@/lib/auth'
import Icon from '@/components/Icon'

const PROVIDER_LABEL: Record<Provider, string> = {
  google: 'Google',
}

export default function Profile() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, ready, init, logout } = useAuth()

  useEffect(() => {
    void init()
  }, [init])

  if (!user) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card grid place-items-center gap-3 p-8 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-white/6">
            <Icon name="user" size={26} />
          </span>
          <p className="text-sm font-bold">{t('auth.notLoggedIn')}</p>
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('auth.loginPrompt')}</p>
          <Link
            to="/login"
            className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-volt-400 px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-volt-300"
          >
            {t('auth.loginCta')}
          </Link>
          {!ready && <span className="text-[11px] text-zinc-400 dark:text-zinc-600">{t('auth.checking')}</span>}
        </div>
      </div>
    )
  }

  const joined = new Date(user.createdAt).toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-extrabold tracking-tight">{t('auth.profileTitle')}</h1>

      <section className="card p-5">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-volt-400/15 text-volt-600 dark:text-volt-300">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <Icon name="user" size={30} />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold">{user.displayName}</p>
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">@{user.username}</p>
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <Row label={t('auth.provider')} value={PROVIDER_LABEL[user.provider]} />
          {user.email && <Row label={t('auth.email')} value={user.email} />}
          <Row label={t('auth.memberSince')} value={joined} />
        </dl>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/teams"
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-600 transition-colors hover:border-volt-500 dark:border-white/10 dark:text-zinc-300"
        >
          <Icon name="users" size={16} />
          {t('nav.teams')}
        </Link>
        <button
          type="button"
          onClick={async () => {
            await logout()
            navigate('/login', { replace: true })
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-red-500 transition-colors hover:border-red-400 dark:border-white/10"
        >
          <Icon name="logout" size={16} />
          {t('auth.logout')}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3 last:border-0 last:pb-0 dark:border-white/6">
      <dt className="font-bold text-zinc-400 dark:text-zinc-500">{label}</dt>
      <dd className="truncate text-right font-semibold">{value}</dd>
    </div>
  )
}
