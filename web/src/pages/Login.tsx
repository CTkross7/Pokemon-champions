import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, checkUsername, isValidUsername, type CheckResult } from '@/lib/auth'

/** OAuth kicks off a full-page redirect handled by the Worker backend. */
const startOAuth = (provider: 'google' | 'apple') => {
  window.location.href = `/api/auth/${provider}/start`
}

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, providers, init, setLocalUser } = useAuth()
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<CheckResult | 'idle' | 'checking'>('idle')

  useEffect(() => {
    void init()
  }, [init])

  // Already logged in → go to profile.
  useEffect(() => {
    if (user) navigate('/profile', { replace: true })
  }, [user, navigate])

  // Debounced availability check as the user types.
  useEffect(() => {
    const u = username.trim().toLowerCase()
    if (!u) return setStatus('idle')
    if (!isValidUsername(u)) return setStatus('invalid')
    setStatus('checking')
    const id = setTimeout(async () => {
      const r = await checkUsername(u)
      setStatus(r)
    }, 400)
    return () => clearTimeout(id)
  }, [username])

  const canContinue = useMemo(
    () => isValidUsername(username.trim().toLowerCase()) && status !== 'taken' && status !== 'checking',
    [username, status],
  )

  const statusText =
    status === 'checking'
      ? { text: t('auth.checking'), cls: 'text-zinc-400' }
      : status === 'available' || status === 'unknown'
        ? username.trim()
          ? { text: t('auth.available'), cls: 'text-emerald-500' }
          : null
        : status === 'taken'
          ? { text: t('auth.taken'), cls: 'text-red-500' }
          : status === 'invalid'
            ? { text: t('auth.invalid'), cls: 'text-red-500' }
            : null

  // providers === null while loading; treat as unconfigured (buttons disabled).
  const googleOn = providers?.google ?? false
  const appleOn = providers?.apple ?? false

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">{t('auth.title')}</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t('auth.subtitle')}</p>
      </div>

      {/* Social providers */}
      <div className="space-y-2.5">
        <button
          type="button"
          disabled={!googleOn}
          onClick={() => startOAuth('google')}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-bold text-zinc-800 transition-colors enabled:hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white"
        >
          <GoogleMark />
          {t('auth.google')}
          {!googleOn && <Badge>{t('auth.providerUnavailable')}</Badge>}
        </button>
        <button
          type="button"
          disabled={!appleOn}
          onClick={() => startOAuth('apple')}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-900 bg-black px-4 py-3 text-sm font-bold text-white transition-colors enabled:hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15"
        >
          <AppleMark />
          {t('auth.apple')}
          {!appleOn && <Badge dark>{t('auth.providerUnavailable')}</Badge>}
        </button>
        {!googleOn && !appleOn && (
          <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-600">{t('auth.providerHint')}</p>
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-300 dark:text-zinc-700">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
        {t('auth.username')}
        <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
      </div>

      {/* Username picker (works as a demo account without a backend) */}
      <div className="card space-y-2 p-4">
        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400" htmlFor="username">
          {t('auth.username')}
        </label>
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 focus-within:border-volt-500 dark:border-white/10">
          <span className="text-sm font-bold text-zinc-400">@</span>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
            placeholder={t('auth.usernamePlaceholder')}
            autoCapitalize="none"
            autoComplete="off"
            className="w-full bg-transparent py-2.5 text-sm font-semibold outline-none"
          />
        </div>
        {statusText ? (
          <p className={`text-[12px] font-bold ${statusText.cls}`}>{statusText.text}</p>
        ) : (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-600">{t('auth.usernameRule')}</p>
        )}
        <button
          type="button"
          disabled={!canContinue}
          onClick={() => {
            setLocalUser(username.trim().toLowerCase())
            navigate('/profile', { replace: true })
          }}
          className="mt-1 w-full rounded-xl bg-volt-400 px-4 py-2.5 text-sm font-bold text-black transition-colors enabled:hover:bg-volt-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('auth.continueDemo')}
        </button>
        <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('auth.demoNote')}</p>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">
        {t('auth.backendPending')}
      </p>
    </div>
  )
}

function Badge({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={[
        'ml-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold',
        dark ? 'bg-white/15 text-white' : 'bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-300',
      ].join(' ')}
    >
      {children}
    </span>
  )
}

/* Brand marks (inline, no external assets). */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.3 17.7 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.5Z" />
      <path fill="#FBBC05" d="M10.4 28.3c-.5-1.4-.7-2.8-.7-4.3s.3-3 .7-4.3l-7.8-6.1C1 16.9 0 20.3 0 24s1 7.1 2.6 10.4l7.8-6.1Z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.3-4.5 2.1-8.8 2.1-6.3 0-11.7-3.8-13.6-9.3l-7.8 6.1C6.5 42.6 14.6 48 24 48Z" />
    </svg>
  )
}
function AppleMark() {
  return (
    <svg width="16" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.7c0-2.6 2.1-3.9 2.2-4-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.1 2.5-1.8 3-.5 7.5 1.3 9.9.9 1.2 1.9 2.5 3.2 2.5 1.3-.1 1.8-.8 3.3-.8 1.5 0 2 .8 3.3.8 1.4 0 2.2-1.2 3.1-2.4.6-.9.9-1.4 1.4-2.4-3.6-1.4-3.1-4.6-3.1-4.6ZM14 4.9c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.5-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.4Z" />
    </svg>
  )
}
