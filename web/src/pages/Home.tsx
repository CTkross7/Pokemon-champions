import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const FEATURES = [
  { key: 'dex', to: '/dex', icon: '📖', ready: false },
  { key: 'calc', to: '/calculator', icon: '🧮', ready: false },
  { key: 'teams', to: '/teams', icon: '🛠️', ready: false },
  { key: 'matchup', to: '/teams', icon: '⚔️', ready: false },
] as const

export default function Home() {
  const { t } = useTranslation()

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-12 text-white sm:px-10 sm:py-16">
        <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">{t('home.heroTitle')}</h1>
        <p className="mt-4 max-w-2xl text-base text-brand-100 sm:text-lg">{t('home.heroSubtitle')}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <Link
            key={feature.key}
            to={feature.to}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl">{feature.icon}</span>
              {!feature.ready && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  {t('home.comingSoon')}
                </span>
              )}
            </div>
            <h2 className="mt-3 text-lg font-bold">{t(`home.features.${feature.key}.title`)}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t(`home.features.${feature.key}.desc`)}
            </p>
          </Link>
        ))}
      </section>
    </div>
  )
}
