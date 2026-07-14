import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, startGoogleLogin, signupEmail, loginEmail, isValidUsername } from '@/lib/auth'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, providers, init } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [id, setId] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void init()
  }, [init])
  useEffect(() => {
    if (user) navigate(user.onboarded === false ? '/welcome' : '/profile', { replace: true })
  }, [user, navigate])

  const googleOn = providers?.google ?? false
  const emailOn = providers?.email ?? false

  const submit = async () => {
    setErr('')
    setBusy(true)
    const r =
      mode === 'signup'
        ? await signupEmail(email, username, password)
        : await loginEmail(id, password)
    setBusy(false)
    if (!r.ok) setErr(t(`auth.err_${r.error}`))
    // On success the auth store updates and the redirect effect fires.
  }

  const canSubmit =
    mode === 'signup'
      ? /\S+@\S+\.\S+/.test(email) && isValidUsername(username) && password.length >= 8
      : id.trim().length > 0 && password.length > 0

  const input =
    'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-volt-500 dark:border-white/10 dark:bg-white/5'

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">{t('auth.title')}</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t('auth.subtitle')}</p>
      </div>

      <div className="card space-y-4 p-6">
        <button
          type="button"
          disabled={!googleOn}
          onClick={startGoogleLogin}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-bold text-zinc-800 transition-colors enabled:hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white"
        >
          <GoogleMark />
          {t('auth.google')}
        </button>
        {!googleOn && <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-600">{t('auth.providerHint')}</p>}

        <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-300 dark:text-zinc-700">
          <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
          {t('auth.or')}
          <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
        </div>

        {/* Email + password */}
        <div className="space-y-2.5">
          {mode === 'signup' ? (
            <>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailLabel')} autoComplete="email" className={input} />
              <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 focus-within:border-volt-500 dark:border-white/10">
                <span className="text-sm font-bold text-zinc-400">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                  placeholder={t('auth.usernamePlaceholder')}
                  autoCapitalize="none"
                  autoComplete="off"
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                />
              </div>
            </>
          ) : (
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder={t('auth.idOrEmail')} autoCapitalize="none" autoComplete="username" className={input} />
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? t('auth.passwordRule') : t('auth.passwordLabel')}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className={input}
          />
          {err && <p className="text-[12px] font-bold text-red-500">{err}</p>}
          <button
            type="button"
            disabled={!emailOn || !canSubmit || busy}
            onClick={submit}
            className="w-full rounded-xl bg-volt-400 px-4 py-2.5 text-sm font-bold text-black transition-colors enabled:hover:bg-volt-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? '…' : mode === 'signup' ? t('auth.signupBtn') : t('auth.loginBtn')}
          </button>
          {!emailOn && <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-600">{t('auth.providerHint')}</p>}
          <button
            type="button"
            onClick={() => {
              setErr('')
              setMode(mode === 'signup' ? 'login' : 'signup')
            }}
            className="w-full text-center text-[12px] font-bold text-volt-600 hover:underline dark:text-volt-400"
          >
            {mode === 'signup' ? t('auth.toLogin') : t('auth.toSignup')}
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('auth.privacyNote')}</p>
    </div>
  )
}

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
