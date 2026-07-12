import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon, { type IconName } from '@/components/Icon'

const FEATURES: ReadonlyArray<{ key: string; to: string; icon: IconName; ready: boolean }> = [
  { key: 'dex', to: '/dex', icon: 'book', ready: false },
  { key: 'calc', to: '/calculator', icon: 'calc', ready: false },
  { key: 'teams', to: '/teams', icon: 'sparkles', ready: false },
  { key: 'matchup', to: '/teams', icon: 'zap', ready: false },
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
      {/* Hero — black with volt glow */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black px-6 py-14 text-white sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -top-28 -left-20 size-80 rounded-full bg-volt-400/25 blur-[110px]" />
        <div className="pointer-events-none absolute -right-24 -bottom-32 size-96 rounded-full bg-volt-500/12 blur-[120px]" />
        {/* fine grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 0%, black, transparent)',
          }}
        />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-zinc-300">
            <span className="size-1.5 animate-pulse rounded-full bg-volt-400" />
            {t('home.badge')}
          </span>
          <h1 className="mt-6 max-w-2xl text-[32px] leading-[1.12] font-extrabold tracking-tight sm:text-5xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-400 sm:text-base">
            {t('home.heroSubtitle')}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/teams"
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-volt-400 px-6 text-sm font-bold text-black shadow-[0_0_28px_-6px_var(--color-volt-400)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              {t('home.ctaTeams')}
              <Icon name="chevronRight" size={15} strokeWidth={2.4} />
            </Link>
            <Link
              to="/calculator"
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-white/20 px-6 text-sm font-bold text-white transition-colors hover:border-white/40 hover:bg-white/5"
            >
              {t('home.ctaCalc')}
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards — volt tiles */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Link
              key={feature.key}
              to={feature.to}
              className="group card relative p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-volt-500/60 hover:shadow-lift dark:hover:border-volt-400/40"
            >
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-volt-400 text-black shadow-soft transition-transform duration-200 group-hover:scale-105">
                  <Icon name={feature.icon} size={23} />
                </span>
                {!feature.ready && (
                  <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-bold text-zinc-400 dark:border-white/10 dark:text-zinc-500">
                    {t('home.comingSoon')}
                  </span>
                )}
              </div>
              <h2 className="mt-4 text-[17px] font-bold tracking-tight">{t(`home.features.${feature.key}.title`)}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t(`home.features.${feature.key}.desc`)}
              </p>
              <span className="mt-4 inline-flex items-center gap-0.5 text-[13px] font-bold text-volt-600 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 dark:text-volt-400">
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
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-volt-100 text-volt-800 dark:bg-volt-400/12 dark:text-volt-300">
              <Icon name={item.icon} size={19} />
            </span>
            <div>
              <h3 className="text-sm font-bold">{t(`home.trust.${item.key}.title`)}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t(`home.trust.${item.key}.desc`)}
              </p>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
