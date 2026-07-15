import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchDeployedVersion, isNewerDeploy } from '@/lib/version'
import { flushCloudPush } from '@/store/teams'
import Icon from '@/components/Icon'

const POLL_MS = 5 * 60 * 1000 // re-check every 5 minutes

/**
 * Watches for a newer deployed build while the tab stays open. When one ships,
 * it surfaces a non-blocking banner; hitting "지금 업데이트" flushes pending
 * cloud saves and reloads so the latest code takes over without losing work.
 * State the user is editing is already persisted (zustand persist writes to
 * localStorage synchronously on every change), so a reload never drops it.
 */
export default function UpdateBanner() {
  const { t } = useTranslation()
  const [available, setAvailable] = useState(false)
  const [reloading, setReloading] = useState(false)

  const check = useCallback(async () => {
    const deployed = await fetchDeployedVersion()
    if (isNewerDeploy(deployed)) setAvailable(true)
  }, [])

  useEffect(() => {
    void check()
    const id = window.setInterval(() => void check(), POLL_MS)
    const onFocus = () => void check()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [check])

  const applyUpdate = async () => {
    setReloading(true)
    // Persist anything still in the debounce window before the reload.
    try {
      await flushCloudPush()
    } catch {
      /* best-effort: local state is already saved regardless */
    }
    // Let the newest service worker take control, then hard-reload.
    try {
      const reg = await navigator.serviceWorker?.getRegistration()
      await reg?.update()
    } catch {
      /* ignore — reload still fetches fresh assets */
    }
    window.location.reload()
  }

  if (!available) return null

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 px-4 lg:bottom-4" role="status" aria-live="polite">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-volt-400/40 bg-zinc-900 px-4 py-3 shadow-soft dark:bg-zinc-900">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-volt-400/15 text-volt-300">
          <Icon name="sparkles" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">{t('update.title')}</p>
          <p className="text-[12px] leading-snug text-zinc-400">{t('update.body')}</p>
        </div>
        <button
          type="button"
          onClick={() => void applyUpdate()}
          disabled={reloading}
          className="shrink-0 rounded-lg bg-volt-400 px-3.5 py-2 text-[13px] font-bold text-black transition-colors enabled:hover:bg-volt-300 disabled:opacity-50"
        >
          {reloading ? t('update.applying') : t('update.apply')}
        </button>
      </div>
    </div>
  )
}
