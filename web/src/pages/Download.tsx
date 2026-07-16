import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Icon from '@/components/Icon'
import {
  APK_URL,
  APK_VERSION,
  APK_SIZE,
  PLAY_URL,
  playAvailable,
  probeApk,
  detectPlatform,
  isInApp,
} from '@/lib/appDownload'

/**
 * Android app download landing page.
 *
 * Announces the ChampsNote Android launcher and offers a direct APK download
 * (and Play Store link once live). Platform-aware: emphasises the download for
 * Android visitors, softens it for iOS (unsupported) / desktop, and hides it
 * entirely inside the app itself (they already have it).
 */
export default function Download() {
  const { t } = useTranslation()
  const platform = detectPlatform()
  const inApp = isInApp()
  const hasPlay = playAvailable()

  // Probe the hosted APK: confirms it's really there and reads its size, so the
  // page shows the real current file with no manual config. undefined = checking.
  const [probe, setProbe] = useState<{ size: string } | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    probeApk().then((r) => {
      if (alive) setProbe(r)
    })
    return () => {
      alive = false
    }
  }, [])
  // Show the button while checking (optimistic) and when confirmed present;
  // only fall back to "coming soon" once the probe confirms it's missing (404).
  const hasApk = probe !== null
  const apkSize = probe?.size || APK_SIZE

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-[28px] border border-zinc-200/70 bg-white px-6 py-10 sm:px-10 sm:py-14 dark:border-white/10 dark:bg-[#0c0d11]"
        style={{
          backgroundImage:
            'radial-gradient(60% 90% at 15% 0%, rgba(208,242,36,0.22), transparent 60%),' +
            'radial-gradient(65% 90% at 100% 100%, rgba(56,132,255,0.16), transparent 62%)',
        }}
      >
        <div className="relative flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-volt-500/40 bg-volt-400/15 px-3 py-1 text-[11px] font-extrabold tracking-wide text-volt-700 dark:text-volt-300">
            <span className="size-1.5 animate-pulse rounded-full bg-volt-500 dark:bg-volt-400" />
            {t('download.badge')}
          </span>

          <img
            src="/icon-512.png"
            alt=""
            width={104}
            height={104}
            className="mt-6 size-24 rounded-[26px] border border-black/5 shadow-lift sm:size-28 dark:border-white/10"
          />

          <h1 className="mt-5 text-[26px] font-extrabold tracking-tight sm:text-4xl">{t('download.title')}</h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-zinc-500 sm:text-[15px] dark:text-zinc-400">
            {t('download.subtitle')}
          </p>

          {/* Version / size chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 dark:border-white/10">
              <Icon name="smartphone" size={13} /> Android
            </span>
            <span className="rounded-full border border-zinc-200 px-2.5 py-1 dark:border-white/10">
              v{APK_VERSION}
            </span>
            {apkSize && (
              <span className="rounded-full border border-zinc-200 px-2.5 py-1 dark:border-white/10">{apkSize}</span>
            )}
          </div>

          {/* Primary CTA — depends on availability + where the visitor is */}
          <div className="mt-7 flex w-full max-w-xs flex-col gap-2.5">
            {inApp ? (
              <div className="rounded-2xl border border-volt-500/40 bg-volt-400/10 px-4 py-3 text-sm font-bold text-volt-700 dark:text-volt-300">
                {t('download.alreadyApp')}
              </div>
            ) : (
              <>
                {hasApk ? (
                  <a
                    href={APK_URL}
                    download
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-volt-400 px-6 py-3.5 text-[15px] font-extrabold text-black shadow-[0_0_28px_-6px_var(--color-volt-400)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Icon name="download" size={19} strokeWidth={2.3} />
                    {t('download.cta')}
                  </a>
                ) : (
                  <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 px-6 py-3.5 text-sm font-bold text-zinc-400 dark:border-white/15 dark:text-zinc-500">
                    <Icon name="download" size={18} />
                    {t('download.comingSoon')}
                  </div>
                )}
                {hasPlay && (
                  <a
                    href={PLAY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 px-6 py-3 text-sm font-bold text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/15 dark:text-zinc-200 dark:hover:border-white/30 dark:hover:bg-white/5"
                  >
                    <Icon name="external" size={16} />
                    {t('download.playStore')}
                  </a>
                )}
              </>
            )}
          </div>

          {/* Platform hints */}
          {platform === 'ios' && !inApp && (
            <p className="mt-3 text-[12px] font-semibold text-amber-600 dark:text-amber-400">{t('download.iosHint')}</p>
          )}
          {platform === 'other' && !inApp && (
            <p className="mt-3 text-[12px] text-zinc-400 dark:text-zinc-500">{t('download.desktopHint')}</p>
          )}
        </div>
      </section>

      {/* Why the app */}
      <section>
        <h2 className="mb-3 text-lg font-extrabold tracking-tight">{t('download.whyTitle')}</h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(t('download.perks', { returnObjects: true }) as string[]).map((perk, i) => (
            <div
              key={i}
              className="card flex items-start gap-2.5 p-3.5"
            >
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-volt-400/20 text-volt-600 dark:text-volt-400">
                <Icon name="check" size={13} strokeWidth={2.6} />
              </span>
              <span className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">{perk}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Install steps */}
      <section>
        <h2 className="mb-3 text-lg font-extrabold tracking-tight">{t('download.installTitle')}</h2>
        <ol className="card divide-y divide-zinc-100 dark:divide-white/6">
          {(t('download.steps', { returnObjects: true }) as string[]).map((step, i) => (
            <li key={i} className="flex items-start gap-3 p-4">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-900 text-[12px] font-extrabold text-white dark:bg-white dark:text-black">
                {i + 1}
              </span>
              <span className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Safety / trust note */}
      <section className="card flex items-start gap-3 p-4">
        <span className="mt-0.5 shrink-0 text-zinc-400 dark:text-zinc-500">
          <Icon name="shield" size={18} />
        </span>
        <div className="space-y-1">
          <p className="text-[13px] font-bold">{t('download.safeTitle')}</p>
          <p className="text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">{t('download.safeBody')}</p>
          <div className="flex flex-wrap gap-3 pt-1 text-[12px] font-bold text-volt-600 dark:text-volt-400">
            <Link to="/privacy" className="hover:underline">
              {t('nav.privacy')}
            </Link>
            <Link to="/about" className="hover:underline">
              {t('nav.about')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
