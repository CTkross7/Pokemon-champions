import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon, { type IconName } from '@/components/Icon'

const FEATURES: ReadonlyArray<{ key: string; to: string; icon: IconName; tint: string; ready: boolean }> = [
  { key: 'dex', to: '/dex', icon: 'book', tint: 'from-sky-500 to-blue-600', ready: false },
  { key: 'calc', to: '/calculator', icon: 'calc', tint: 'from-violet-500 to-purple-600', ready: false },
  { key: 'teams', to: '/teams', icon: 'sparkles', tint: 'from-emerald-500 to-teal-600', ready: false },
  { key: 'matchup', to: '/teams', icon: 'zap', tint: 'from-amber-500 to-orange-600', ready: false },
]

const TRUST: ReadonlyArray<{ key: string; icon: IconName }> = [
  { key: 'verified', icon: 'shield' },
  { key: 'free', icon: 'sparkles' },
  { key: 'crossPlatform', icon: 'globe' },
]

export default function Home() {
  const { t } = useTranslation()

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[28px] bg-slate-950 px-6 py-14 text-white sm:px-12 sm:py-20 dark:border dark:border-white/8">
        {/* glow blobs */}
        <div className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-brand-500/40 blur-[100px]" />
        <div className="pointer-events-none absolute -right-20 -bottom-28 size-80 rounded-full bg-violet-glow/35 blur-[110px]" />
        <div className="pointer-events-none absolute top-1/3 left-1/2 size-56 rounded-full bg-brand-400/20 blur-[90px]" />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold tracking-wide text-brand-200">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            {t('home.badge')}
          </span>
          <h1 className="mt-5 max-w-2xl text-[32px] leading-[1.15] font-extrabold tracking-tight sm:text-5xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-300 sm:text-base">
            {t('home.heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/teams"
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-sm font-bold text-slate-900 transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              {t('home.ctaTeams')}
              <Icon name="chevronRight" size={15} strokeWidth={2.4} />
            </Link>
            <Link
              to="/calculator"
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-white/20 bg-white/8 px-5 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/15"
            >
              {t('home.ctaCalc')}
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Link
              key={feature.key}
              to={feature.to}
              className="group card relative p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${feature.tint} text-white shadow-soft`}
                >
                  <Icon name={feature.icon} size={23} />
                </span>
                {!feature.ready && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-white/8 dark:text-slate-400">
                    {t('home.comingSoon')}
                  </span>
                )}
              </div>
              <h2 className="mt-4 text-[17px] font-bold tracking-tight">{t(`home.features.${feature.key}.title`)}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {t(`home.features.${feature.key}.desc`)}
              </p>
              <span className="mt-4 inline-flex items-center gap-0.5 text-[13px] font-bold text-brand-500 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                {t('home.openTool')}
                <Icon name="chevronRight" size={13} strokeWidth={2.4} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="card grid gap-6 p-6 sm:grid-cols-3 sm:gap-4 sm:p-8">
        {TRUST.map((item) => (
          <div key={item.key} className="flex items-start gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-300">
              <Icon name={item.icon} size={19} />
            </span>
            <div>
              <h3 className="text-sm font-bold">{t(`home.trust.${item.key}.title`)}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                {t(`home.trust.${item.key}.desc`)}
              </p>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
