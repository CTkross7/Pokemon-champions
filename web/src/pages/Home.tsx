import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon, { type IconName } from '@/components/Icon'
import Sprite from '@/components/Sprite'
import { loadPokedexAll, type Species } from '@/lib/dex'
import { loadUsage, resolveUsageMon, type UsageData } from '@/lib/stats'
import { loadRegulation, daysUntil, type Regulation } from '@/lib/regulation'
import { listNotices, type Notice } from '@/lib/notices'
import { listSamples, type SampleMeta } from '@/lib/api'
import { sampleSpecies } from '@/lib/sampleSprites'
import { useAuth } from '@/lib/auth'
import { isInApp } from '@/lib/appDownload'

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
  const user = useAuth((s) => s.user)
  const [reg, setReg] = useState<Regulation | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [byId, setById] = useState<Map<string, Species>>(new Map())
  const [notices, setNotices] = useState<Notice[]>([])
  const [popMon, setPopMon] = useState<SampleMeta[]>([])
  const [popTeam, setPopTeam] = useState<SampleMeta[]>([])

  useEffect(() => {
    loadRegulation().then(setReg)
    loadUsage().then(setUsage, () => {})
    loadPokedexAll().then((all) => setById(new Map(all.map((s) => [s.id, s]))), () => {})
    listNotices()
      .then((n) => setNotices(n.slice(0, 2)))
      .catch(() => {})
    // Popular community picks: top samples (single mon) and parties (teams).
    listSamples(undefined, 'mon', 'popular').then((r) => r.configured && setPopMon(r.data.samples.slice(0, 8)), () => {})
    listSamples(undefined, 'team', 'popular').then((r) => r.configured && setPopTeam(r.data.samples.slice(0, 8)), () => {})
  }, [])

  const dday = daysUntil(reg)
  const regLabel = reg ? (ko ? reg.label.ko : reg.label.en) : t('home.badge')

  const top = useMemo(() => {
    if (!usage || byId.size === 0) return []
    return usage.pokemon.slice(0, 8).map((u) => ({ u, m: resolveUsageMon(u.id, u.name, byId, ko) }))
  }, [usage, byId, ko])

  return (
    <div className="space-y-10">
      {/* Account strip — sign in/up prompt for guests, quick shortcuts for all */}
      {user ? (
        <section className="card flex flex-wrap items-center gap-3 p-3.5">
          <Link to="/profile" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-volt-400/15 text-volt-600 dark:text-volt-300">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="size-full object-cover" /> : <Icon name="user" size={18} />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{t('home.hello', { name: user.displayName })}</span>
              <span className="block truncate text-[11px] text-zinc-400 dark:text-zinc-500">@{user.username}</span>
            </span>
          </Link>
          <div className="ml-auto flex shrink-0 gap-1.5">
            <HomeChip to="/profile" icon="user" label={t('nav.profile')} />
            <HomeChip to="/about" icon="info" label={t('nav.about')} />
            <HomeChip to="/settings" icon="settings" label={t('nav.settings')} />
          </div>
        </section>
      ) : (
        <section className="card flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">{t('home.authTitle')}</p>
            <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">{t('home.authBody')}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link to="/about" className="hidden rounded-full border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-600 hover:border-volt-500 sm:inline-flex dark:border-white/10 dark:text-zinc-300">
              {t('nav.about')}
            </Link>
            <Link to="/login" className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700 hover:border-volt-500 dark:border-white/10 dark:text-zinc-200">
              {t('auth.login')}
            </Link>
            <Link to="/login" className="inline-flex items-center gap-1 rounded-full bg-volt-400 px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-volt-300">
              {t('auth.signup')}
            </Link>
          </div>
        </section>
      )}

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

      {/* Android app release banner — hidden inside the app itself */}
      {!isInApp() && (
        <Link
          to="/download"
          className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-volt-500/40 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift dark:border-volt-400/30 dark:bg-[#0c0d11]"
          style={{
            backgroundImage:
              'radial-gradient(70% 140% at 100% 0%, rgba(208,242,36,0.16), transparent 60%)',
          }}
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-volt-400 text-black shadow-soft transition-transform group-hover:scale-105">
            <Icon name="smartphone" size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-volt-400/20 px-2 py-0.5 text-[10px] font-extrabold text-volt-700 dark:text-volt-300">
              {t('download.badge')}
            </span>
            <p className="mt-1 text-[15px] font-extrabold tracking-tight">{t('home.appTitle')}</p>
            <p className="truncate text-[12px] text-zinc-500 dark:text-zinc-400">{t('home.appDesc')}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-volt-400 px-3.5 py-2 text-[12px] font-extrabold text-black">
            <Icon name="download" size={14} strokeWidth={2.4} />
            <span className="hidden sm:inline">{t('download.cta')}</span>
          </span>
        </Link>
      )}

      {/* Meta preview — top usage Pokemon, links to the full stats page */}
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

      {/* Popular community picks — single-mon samples + full parties (by likes) */}
      {popMon.length > 0 && (
        <PopularRow title={t('home.popularSamples')} samples={popMon} byId={byId} single />
      )}
      {popTeam.length > 0 && <PopularRow title={t('home.popularParties')} samples={popTeam} byId={byId} />}

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

/** Ranked list of popular samples/parties — rank badge + sprite(s) + likes. */
function PopularRow({
  title,
  samples,
  byId,
  single,
}: {
  title: string
  samples: SampleMeta[]
  byId: Map<string, Species>
  single?: boolean
}) {
  const { t } = useTranslation()
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
        <Link to="/gallery" className="shrink-0 text-[13px] font-bold text-volt-600 dark:text-volt-400">
          {t('home.viewAll')} →
        </Link>
      </div>
      <ol className="card divide-y divide-zinc-100 overflow-hidden p-0 dark:divide-white/6">
        {samples.slice(0, 5).map((s, i) => {
          const species = sampleSpecies(s.team, byId)
          const top3 = i < 3
          return (
            <li key={s.id}>
              <Link
                to="/gallery"
                className="group flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-lg text-[12px] font-extrabold ${
                    top3
                      ? 'bg-volt-400 text-black'
                      : 'bg-zinc-100 text-zinc-400 dark:bg-white/6 dark:text-zinc-500'
                  }`}
                >
                  {i + 1}
                </span>
                {single ? (
                  species[0] ? (
                    <Sprite species={species[0]} size={36} className="shrink-0" />
                  ) : (
                    <span className="grid size-9 shrink-0 place-items-center text-zinc-300">
                      <Icon name="sparkles" size={18} />
                    </span>
                  )
                ) : (
                  <div className="flex shrink-0 -space-x-2">
                    {species.slice(0, 4).map((sp, k) => (
                      <span key={k} className="rounded-full bg-white ring-1 ring-zinc-100 dark:bg-card-dark dark:ring-white/10">
                        <Sprite species={sp} size={26} />
                      </span>
                    ))}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{s.title}</p>
                  <p className="truncate text-[11px] font-medium text-zinc-400 dark:text-zinc-500">{s.author}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-extrabold text-rose-500">
                  <Icon name="heart" size={13} />
                  {s.likes}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
function HomeChip({ to, icon, label }: { to: string; icon: IconName; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1.5 text-[11px] font-bold text-zinc-600 transition-colors hover:border-volt-500 hover:text-volt-700 dark:border-white/10 dark:text-zinc-300 dark:hover:border-volt-400/60 dark:hover:text-volt-300"
      title={label}
    >
      <Icon name={icon} size={13} />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  )
}
