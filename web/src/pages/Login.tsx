import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, startGoogleLogin } from '@/lib/auth'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, providers, init } = useAuth()

  useEffect(() => {
    void init()
  }, [init])

  // Already signed in → go to profile.
  useEffect(() => {
    if (user) navigate('/profile', { replace: true })
  }, [user, navigate])

  const googleOn = providers?.google ?? false

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">{t('auth.title')}</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t('auth.subtitle')}</p>
      </div>

      <div className="card space-y-3 p-6">
        <button
          type="button"
          disabled={!googleOn}
          onClick={startGoogleLogin}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-bold text-zinc-800 transition-colors enabled:hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white"
        >
          <GoogleMark />
          {t('auth.google')}
        </button>
        {!googleOn && (
          <p className="text-center text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">
            {t('auth.providerHint')}
          </p>
        )}
        <p className="text-center text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('auth.subtitle2')}</p>
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
