import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/auth'
import Icon from '@/components/Icon'

/**
 * Renders its children only for signed-in users; otherwise shows a sign-in
 * prompt. Used to gate team building/saving and community features.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { user, ready, init } = useAuth()

  useEffect(() => {
    void init()
  }, [init])

  if (user) return <>{children}</>

  return (
    <div className="mx-auto max-w-md">
      <div className="card grid place-items-center gap-3 p-10 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-white/6">
          <Icon name="user" size={26} />
        </span>
        <p className="text-sm font-bold">{t('auth.gateTitle')}</p>
        <p className="text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">{t('auth.gateBody')}</p>
        <Link
          to="/login"
          className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-volt-400 px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-volt-300"
        >
          {t('auth.loginCta')}
        </Link>
        {!ready && <span className="text-[11px] text-zinc-400 dark:text-zinc-600">…</span>}
      </div>
    </div>
  )
}
