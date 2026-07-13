import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadMoves, loadPokedex, type MoveData, type Species } from '@/lib/dex'
import {
  loadUsage,
  loadTranslations,
  groupByTier,
  resolveUsageMon,
  abilityKo,
  itemKo,
  spreadKo,
  type UsageData,
  type UsageOption,
  type Translations,
} from '@/lib/stats'
import DexTabs from '@/components/DexTabs'
import Sprite from '@/components/Sprite'
import TypeBadge from '@/components/TypeBadge'

const TIER_COLOR: Record<string, string> = {
  AG: 'bg-red-500',
  Uber: 'bg-fuchsia-500',
  OU: 'bg-volt-500',
  UUBL: 'bg-orange-400',
  UU: 'bg-sky-500',
  RUBL: 'bg-teal-500',
  RU: 'bg-emerald-500',
}

export default function Stats() {
  const { t, i18n } = useTranslation()
  const ko = i18n.language === 'ko'
  const [pokedex, setPokedex] = useState<Species[] | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [moves, setMoves] = useState<Record<string, MoveData> | null>(null)
  const [tr, setTr] = useState<Translations | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    loadPokedex().then(setPokedex, () => setPokedex([]))
    loadUsage().then(setUsage)
    loadMoves().then(setMoves)
    loadTranslations().then(setTr)
  }, [])

  const speciesById = useMemo(() => new Map((pokedex ?? []).map((s) => [s.id, s])), [pokedex])
  const tiers = useMemo(() => (pokedex ? groupByTier(pokedex) : []), [pokedex])
  const name = (s: Species) => (ko ? s.ko : s.name)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DexTabs />
      </div>

      <div>
        <h1 className="text-xl font-extrabold tracking-tight">{t('stats.title')}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('stats.subtitle')}</p>
      </div>

      {/* Usage ranking — always visible. Real ladder data arrives via the
          auto-update pipeline; until then we show a clear collecting state. */}
      <section className="card p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold">{t('stats.usageTitle')}</h2>
          {usage && usage.pokemon.length > 0 && (
            <span className="shrink-0 text-right text-[11px] font-bold text-zinc-400 dark:text-zinc-600">
              {usage.fallback ? t('stats.sourceFallback') : t('stats.source', { month: usage.month })}
            </span>
          )}
        </div>

        {(!usage || usage.pokemon.length === 0) && (
          <div className="mt-3 grid place-items-center gap-2 rounded-xl border border-dashed border-zinc-300 py-8 text-center dark:border-white/10">
            <span className="size-2.5 animate-pulse rounded-full bg-volt-500" />
            <p className="text-[12px] font-semibold text-zinc-500 dark:text-zinc-400">{t('stats.usagePending')}</p>
          </div>
        )}

        {usage && usage.fallback && usage.pokemon.length > 0 && (
          <p className="mt-1 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
            {t('stats.fallbackNote')}
          </p>
        )}

        {usage && usage.pokemon.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {usage.pokemon.slice(0, 30).map((u, i) => {
              const mon = resolveUsageMon(u.id, u.name, speciesById, ko)
              const maxUsage = usage.pokemon[0].usage || 1
              const hasDetail =
                u.moves.length > 0 || u.items.length > 0 || u.abilities.length > 0 || u.spreads.length > 0
              const isOpen = open === u.id && hasDetail
              return (
                <div key={u.id} className="rounded-xl border border-zinc-200/70 dark:border-white/8">
                  <button
                    type="button"
                    onClick={() => hasDetail && setOpen(isOpen ? null : u.id)}
                    aria-expanded={isOpen}
                    className={`flex w-full items-center gap-3 p-2.5 text-left ${hasDetail ? '' : 'cursor-default'}`}
                  >
                    <span className="w-5 shrink-0 text-center text-xs font-extrabold text-zinc-400 dark:text-zinc-600">
                      {i + 1}
                    </span>
                    {mon.species ? <Sprite species={mon.species} size={28} /> : <span className="size-7" />}
                    <span className="flex w-28 shrink-0 items-center gap-1 truncate text-sm font-bold">
                      <span className="truncate">{mon.label}</span>
                      {mon.isMega && (
                        <span className="shrink-0 rounded bg-fuchsia-500/15 px-1 text-[9px] font-extrabold text-fuchsia-600 dark:text-fuchsia-400">
                          M
                        </span>
                      )}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/6">
                      <div className="h-full rounded-full bg-volt-500" style={{ width: `${(u.usage / maxUsage) * 100}%` }} />
                    </div>
                    <span className="w-12 shrink-0 text-right text-sm font-extrabold tabular-nums">{u.usage}%</span>
                  </button>
                  {isOpen && (
                    <dl className="space-y-2.5 border-t border-zinc-200/70 p-3 text-[11px] dark:border-white/8">
                      <StatBars
                        label={t('stats.moves')}
                        options={u.moves}
                        localize={(m) => (ko && moves?.[m.toLowerCase().replace(/[^a-z0-9]/g, '')]?.ko) || moves?.[m.toLowerCase().replace(/[^a-z0-9]/g, '')]?.name || m}
                      />
                      <StatBars
                        label={t('stats.items')}
                        options={u.items}
                        localize={(name) => (ko && tr ? itemKo(tr, name) : name)}
                      />
                      <StatBars
                        label={t('stats.abilities')}
                        options={u.abilities}
                        localize={(name) => (ko && tr ? abilityKo(tr, name) : name)}
                      />
                      <StatBars
                        label={t('stats.spreads')}
                        options={u.spreads}
                        localize={(name) => (ko && tr ? spreadKo(tr, name) : name)}
                        mono
                      />
                    </dl>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Tier rankings — always available (competitive, usage-derived) */}
      <section className="card p-5">
        <h2 className="text-[15px] font-bold">{t('stats.tierTitle')}</h2>
        <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-600">{t('stats.tierNote')}</p>
        {!pokedex && <div className="mt-4 h-40 animate-pulse rounded-xl bg-zinc-100 dark:bg-white/5" />}
        <div className="mt-4 space-y-5">
          {tiers.map(({ tier, mons }) => (
            <div key={tier}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold text-white ${TIER_COLOR[tier] ?? 'bg-zinc-500'}`}>
                  {tier}
                </span>
                <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600">
                  {t('stats.count', { count: mons.length })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {mons.slice(0, 12).map((s) => (
                  <Link
                    key={s.id}
                    to={`/dex/${s.id}`}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200/70 p-2 transition-colors hover:border-volt-500/60 dark:border-white/8 dark:hover:border-volt-400/40"
                  >
                    <Sprite species={s} size={30} />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-bold">{name(s)}</p>
                      <div className="flex gap-0.5">
                        {s.types.map((tp) => (
                          <TypeBadge key={tp} type={tp} size="sm" />
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

/**
 * Renders a labelled group of usage options as horizontal bars, each showing
 * the localized name and its adoption percentage (ladder usage ratio). Bars are
 * scaled to the group's top option so the leading choice fills the row.
 */
function StatBars({
  label,
  options,
  localize,
  mono,
}: {
  label: string
  options: UsageOption[]
  localize: (name: string) => string
  mono?: boolean
}) {
  if (!options || options.length === 0) return null
  const max = Math.max(...options.map((o) => o.pct), 1)
  const hasPct = options.some((o) => o.pct > 0)
  return (
    <div className="flex gap-2">
      <dt className="w-12 shrink-0 pt-0.5 font-bold text-zinc-400 dark:text-zinc-600">{label}</dt>
      <dd className="flex-1 space-y-1">
        {options.map((o) => (
          <div key={o.name} className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1 overflow-hidden rounded bg-zinc-100 dark:bg-white/6">
              {hasPct && (
                <div
                  className="absolute inset-y-0 left-0 rounded bg-volt-500/25 dark:bg-volt-400/20"
                  style={{ width: `${(o.pct / max) * 100}%` }}
                />
              )}
              <span
                className={`relative block truncate px-1.5 py-0.5 font-semibold ${mono ? 'font-mono text-[10px]' : ''}`}
              >
                {localize(o.name)}
              </span>
            </div>
            {hasPct && (
              <span className="w-10 shrink-0 text-right tabular-nums font-bold text-zinc-500 dark:text-zinc-400">
                {o.pct}%
              </span>
            )}
          </div>
        ))}
      </dd>
    </div>
  )
}
