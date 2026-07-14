import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon, { type IconName } from '@/components/Icon'
import Sprite from '@/components/Sprite'
import { loadPokedexAll, type Species } from '@/lib/dex'
import { loadUsage, resolveUsageMon, type UsageData } from '@/lib/stats'
import { loadRegulation, daysUntil, type Regulation } from '@/lib/regulation'
import { listNotices, type Notice } from '@/lib/notices'

// Each feature gets its own accent so the UI reads colorful and clean rather
// than mono-lime. Tones map to icon-tile + hover-border classes.
const TONES = {
  volt: { tile: 'bg-volt-400 text-black', border: 'hover:border-volt-500/60 dark:hover:border-volt-400/40', link: 'text-volt-600 dark:text-volt-400' },
  sky: { tile: 'bg-sky-500 text-white', border: 'hover:border-sky-400/70 dark:hover:border-sky-400/50', link: 'text-sky-600 dark:text-sky-400' },
  violet: { tile: 'bg-violet-500 text-white', border: 'hover:border-violet-400/70 dark:hover:border-violet-400/50', link: 'text-violet-600 dark:text-violet-400' },
  amber: { tile: 'bg-amber-400 text-black', border: 'hover:border-amber-400/70 dark:hover:border-amber-400/50', link: 'text-amber-600 dark:text-amber-400' },
} as const

const FEATURES: ReadonlyArray<{ key: string; to: string; icon: IconName; ready: boolean; tone: keyof typeof TONES }> = [
  { key: 'dex', to: '/dex', icon: 'book', ready: true, tone: 'sky' },
  { key: 'calc', to: '/calculator', icon: 'calc', ready: true, tone: 'volt' },
  { key: 'teams', to: '/teams', icon: 'sparkles', ready: true, tone: 'violet' },
  { key: 'matchup', to: '/matchup', icon: 'zap', ready: true, tone: 'amber' },
]

const CAT_STYLE: Record<string, string> = {
  notice: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  update: 'bg-volt-500/20 text-volt-700 dark:text-volt-300',
  event: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
}

export default function Home() {
  const { t, i18n } = useTranslation()
  const ko = i18n.language === 'ko'
  const [reg, setReg] = useState<Regulation | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [byId, setById] = useState<Map<string, Species>>(new Map())
  const [notices, setNotices] = useState<Notice[]>([])

  useEffect(() => {
    loadRegulation().then(setReg)
    loadUsage().then(setUsage, () => {})
    loadPokedexAll().then((all) => setById(new Map(all.map((s) => [s.id, s]))), () => {})
    listNotices()
      .then((n) => setNotices(n.slice(0, 2)))
      .catch(() => {})
  }, [])

  const dday = daysUntil(reg?.endDate ?? null)
  const regLabel = reg ? (ko ? reg.label.ko : reg.label.en) : t('home.badge')

  const top = useMemo(() => {
    if (!usage || byId.size === 0) return []
    return usage.pokemon.slice(0, 8).map((u) => ({ u, m: resolveUsageMon(u.id, u.name, byId, ko) }))
  }, [usage, byId, ko])

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-[28px] border border-zinc-200/70 bg-white px-6 py-12 text-zinc-900 sm:px-12 sm:py-16 dark:border-white/10 dark:bg-[#0c0d11] dark:text-white"
        style={{
          backgroundImage:
            'radial-gradient(55% 80% at 10% 0%, rgba(208,242,36,0.20), transparent 60%),' +
            'radial-gradient(60% 80% at 100% 100%, rgba(56,132,255,0.18), transparent 62%)',
        }}
      >
        <div className="relative">
          {/* Live season chip: regulation label + D-day when a verified end date exists */}
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-zinc-600 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300">
            <span className="size-1.5 animate-pulse rounded-full bg-volt-500 dark:bg-volt-400" />
            {regLabel}
            {dday !== null && dday >= 0 && (
              <span className="ml-1 rounded-full bg-volt-400 px-2 py-0.5 text-[10px] font-extrabold text-black">
                {t('home.dday', { days: dday })}
              </span>
            )}
          </span>
          <h1 className="mt-6 max-w-2xl text-[32px] leading-[1.12] font-extrabold tracking-tight sm:text-5xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-500 sm:text-base dark:text-zinc-400">
            {t('home.heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/teams"
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-volt-400 px-6 text-sm font-bold text-black shadow-[0_0_28px_-6px_var(--color-volt-400)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              {t('home.ctaTeams')}
              <Icon name="chevronRight" size={15} strokeWidth={2.4} />
            </Link>
            <Link
              to="/calculator"
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-zinc-300 px-6 text-sm font-bold text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/20 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/5"
            >
              {t('home.ctaCalc')}
            </Link>
          </div>
        </div>
      </section>

      {/* Meta preview — top usage Pokémon, links to the full stats page */}
      {top.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">{t('home.metaTitle')}</h2>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
                {usage?.fallback ? t('home.metaFallback') : t('home.metaSub', { month: usage?.month ?? '' })}
              </p>
            </div>
            <Link to="/stats" className="shrink-0 text-[13px] font-bold text-volt-600 dark:text-volt-400">
              {t('home.viewAll')} →
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {top.map(({ u, m }, i) => (
              <Link
                key={u.id}
                to="/stats"
                className="card group flex flex-col items-center gap-1 p-2.5 transition-all hover:-translate-y-0.5 hover:border-volt-500/60 dark:hover:border-volt-400/40"
                title={m.label}
              >
                <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-600">{i + 1}</span>
                {m.species ? (
                  <Sprite species={m.species} size={48} className="transition-transform group-hover:scale-110" />
                ) : (
                  <span className="grid size-12 place-items-center text-zinc-300">
                    <Icon name="book" size={20} />
                  </span>
                )}
                <span className="w-full truncate text-center text-[11px] font-bold">{m.label}</span>
                <span className="text-[10px] font-extrabold text-volt-600 dark:text-volt-400">{u.usage}%</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Feature cards — each with its own accent tone */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const tone = TONES[feature.tone]
            return (
              <Link
                key={feature.key}
                to={feature.to}
                className={`group card relative p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift ${tone.border}`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`grid size-12 place-items-center rounded-2xl shadow-soft transition-transform duration-200 group-hover:scale-105 ${tone.tile}`}
                  >
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
                <span
                  className={`mt-4 inline-flex items-center gap-0.5 text-[13px] font-bold transition-opacity sm:opacity-0 sm:group-hover:opacity-100 ${tone.link}`}
                >
                  {t('home.openTool')}
                  <Icon name="chevronRight" size={13} strokeWidth={2.4} />
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Latest notices preview */}
      {notices.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-extrabold tracking-tight">{t('home.noticesTitle')}</h2>
            <Link to="/notices" className="shrink-0 text-[13px] font-bold text-volt-600 dark:text-volt-400">
              {t('home.viewAll')} →
            </Link>
          </div>
          <div className="space-y-2">
            {notices.map((n) => (
              <Link key={n.id} to="/notices" className="card flex items-center gap-3 p-3.5 transition-colors hover:border-volt-500/60 dark:hover:border-volt-400/40">
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold ${CAT_STYLE[n.category] ?? CAT_STYLE.notice}`}>
                  {t(`notices.cat_${n.category}`)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{n.title}</span>
                <Icon name="chevronRight" size={14} className="shrink-0 text-zinc-300 dark:text-zinc-600" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
