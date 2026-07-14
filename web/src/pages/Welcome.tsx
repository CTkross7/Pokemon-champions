import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, setUsername, checkUsername, isValidUsername, type CheckResult } from '@/lib/auth'

/** First-login onboarding: a signed-in Google user claims a unique username. */
export default function Welcome() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, ready, init } = useAuth()
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<CheckResult | 'idle' | 'checking'>('idle')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void init()
  }, [init])
  // Not logged in → login; already onboarded → profile.
  useEffect(() => {
    if (ready && !user) navigate('/login', { replace: true })
    else if (user && user.onboarded !== false) navigate('/profile', { replace: true })
  }, [ready, user, navigate])

  useEffect(() => {
    const u = value.trim().toLowerCase()
    if (!u) return setStatus('idle')
    if (!isValidUsername(u)) return setStatus('invalid')
    setStatus('checking')
    const id = setTimeout(async () => setStatus(await checkUsername(u)), 400)
    return () => clearTimeout(id)
  }, [value])

  const canSave = useMemo(() => isValidUsername(value) && (status === 'available' || status === 'unknown'), [value, status])

  const save = async () => {
    setBusy(true)
    const r = await setUsername(value.trim().toLowerCase())
    setBusy(false)
    if (r.ok) navigate('/profile', { replace: true })
    else setStatus('taken')
  }

  const statusText =
    status === 'checking'
      ? { text: t('auth.checking'), cls: 'text-zinc-400' }
      : status === 'available'
        ? { text: t('auth.available'), cls: 'text-emerald-500' }
        : status === 'taken'
          ? { text: t('auth.taken'), cls: 'text-red-500' }
          : status === 'invalid'
            ? { text: t('auth.invalid'), cls: 'text-red-500' }
            : null

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">{t('auth.welcomeTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t('auth.welcomeDesc')}</p>
      </div>
      <div className="card space-y-2 p-6">
        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400" htmlFor="uname">
          {t('auth.username')}
        </label>
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 focus-within:border-volt-500 dark:border-white/10">
          <span className="text-sm font-bold text-zinc-400">@</span>
          <input
            id="uname"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
            placeholder={t('auth.usernamePlaceholder')}
            autoCapitalize="none"
            autoComplete="off"
            className="w-full bg-transparent py-2.5 text-sm outline-none"
          />
        </div>
        {statusText ? (
          <p className={`text-[12px] font-bold ${statusText.cls}`}>{statusText.text}</p>
        ) : (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-600">{t('auth.usernameRule')}</p>
        )}
        <button
          type="button"
          disabled={!canSave || busy}
          onClick={save}
          className="mt-1 w-full rounded-xl bg-volt-400 px-4 py-2.5 text-sm font-bold text-black transition-colors enabled:hover:bg-volt-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? t('auth.usernameSaving') : t('auth.usernameSet')}
        </button>
      </div>
    </div>
  )
}
