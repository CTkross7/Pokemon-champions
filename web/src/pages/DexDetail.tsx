import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  loadLearnsets,
  loadMoves,
  loadPokedex,
  statTotal,
  STAT_KEYS,
  type MoveData,
  type Species,
} from '@/lib/dex'
import { defensiveProfile, TYPE_COLORS, type TypeName } from '@/lib/typechart'
import Sprite from '@/components/Sprite'
import TypeBadge from '@/components/TypeBadge'
import Icon from '@/components/Icon'

const STAT_MAX = 255

function statBarColor(value: number): string {
  if (value >= 130) return 'bg-volt-400'
  if (value >= 100) return 'bg-volt-500'
  if (value >= 70) return 'bg-zinc-400 dark:bg-zinc-500'
  return 'bg-zinc-300 dark:bg-zinc-700'
}

function MatchupRow({ label, types }: { label: string; types: TypeName[] }) {
  if (types.length === 0) return null
  return (
    <div className="flex items-start gap-3">
      <span className="w-12 shrink-0 pt-0.5 text-right text-xs font-extrabold text-zinc-500 tabular-nums dark:text-zinc-400">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {types.map((type) => (
          <TypeBadge key={type} type={type} size="sm" />
        ))}
      </div>
    </div>
  )
}

export default function DexDetail() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const [all, setAll] = useState<Species[] | null>(null)
  const [moves, setMoves] = useState<Record<string, MoveData> | null>(null)
  const [learnset, setLearnset] = useState<string[] | null>(null)

  useEffect(() => {
    loadPokedex().then(setAll, () => setAll([]))
  }, [])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    Promise.all([loadMoves(), loadLearnsets()]).then(([m, ls]) => {
      if (cancelled) return
      setMoves(m)
      setLearnset(ls[id] ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [id])

  const species = useMemo(() => all?.find((s) => s.id === id), [all, id])
  const formes = useMemo(() => {
    if (!all || !species) return []
    const baseId = species.baseSpecies ?? species.id
    return all.filter((s) => s.id !== species.id && (s.id === baseId || s.baseSpecies === baseId))
  }, [all, species])

  const profile = useMemo(() => (species ? defensiveProfile(species.types) : null), [species])

  const learnsetMoves = useMemo(() => {
    if (!moves || !learnset) return null
    return learnset
      .map((moveId) => moves[moveId])
      .filter(Boolean)
      .sort((a, b) => a.type.localeCompare(b.type) || b.basePower - a.basePower)
  }, [moves, learnset])

  if (all && !species) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm font-semibold text-zinc-500">{t('dex.notFound')}</p>
        <Link to="/dex" className="mt-4 inline-block text-sm font-bold text-volt-600 dark:text-volt-400">
          {t('dex.backToDex')}
        </Link>
      </div>
    )
  }
  if (!species || !profile) {
    return <div className="card h-64 animate-pulse" />
  }

  const name = i18n.language === 'ko' ? species.ko : species.name
  const subName = i18n.language === 'ko' ? species.name : species.ko

  return (
    <div className="space-y-6">
      <Link
        to="/dex"
        className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      >
        <Icon name="chevronRight" size={14} className="rotate-180" />
        {t('dex.backToDex')}
      </Link>

      {/* Header card */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full opacity-15 blur-[70px]"
          style={{ backgroundColor: TYPE_COLORS[species.types[0] as TypeName] }}
        />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="grid size-28 place-items-center rounded-3xl bg-zinc-100 dark:bg-white/5">
            <Sprite species={species} size={96} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 dark:text-zinc-500">
              #{String(species.num).padStart(4, '0')}
              {species.champions && (
                <span className="rounded-full bg-volt-100 px-2 py-0.5 text-[10px] font-extrabold text-volt-800 dark:bg-volt-400/15 dark:text-volt-300">
                  {t('dex.championsBadge')}
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{name}</h1>
            <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">{subName}</p>
            <div className="mt-2 flex gap-1.5">
              {species.types.map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
          </div>
        </div>
        {formes.length > 0 && (
          <div className="relative mt-5 flex flex-wrap items-center gap-2 border-t border-zinc-200/70 pt-4 dark:border-white/8">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">{t('dex.formes')}</span>
            {formes.map((f) => (
              <Link
                key={f.id}
                to={`/dex/${f.id}`}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold text-zinc-600 transition-colors hover:border-volt-500 hover:text-volt-700 dark:border-white/10 dark:text-zinc-300 dark:hover:border-volt-400/60 dark:hover:text-volt-300"
              >
                {i18n.language === 'ko' ? f.ko : f.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Base stats */}
        <section className="card p-6">
          <h2 className="text-[15px] font-bold">{t('dex.baseStats')}</h2>
          <div className="mt-4 space-y-2.5">
            {STAT_KEYS.map((key) => {
              const value = species.baseStats[key]
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    {t(`dex.stats.${key}`)}
                  </span>
                  <span className="w-9 shrink-0 text-right text-sm font-extrabold tabular-nums">{value}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/6">
                    <div
                      className={`h-full rounded-full ${statBarColor(value)}`}
                      style={{ width: `${Math.min(100, (value / STAT_MAX) * 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <div className="flex items-center gap-3 border-t border-zinc-200/70 pt-2.5 dark:border-white/8">
              <span className="w-14 shrink-0 text-xs font-extrabold text-zinc-500 dark:text-zinc-400">
                {t('dex.statsTotal')}
              </span>
              <span className="w-9 shrink-0 text-right text-sm font-extrabold text-volt-600 tabular-nums dark:text-volt-400">
                {statTotal(species)}
              </span>
            </div>
          </div>

          <h2 className="mt-6 text-[15px] font-bold">{t('dex.abilities')}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {species.abilities.map((ability) => (
              <span
                key={ability.name}
                className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-white/6 dark:text-zinc-200"
              >
                {i18n.language === 'ko' ? ability.ko : ability.name}
                <span className="ml-1.5 font-medium text-zinc-400 dark:text-zinc-500">
                  {i18n.language === 'ko' ? ability.name : ability.ko}
                </span>
              </span>
            ))}
          </div>
        </section>

        {/* Defensive matchups */}
        <section className="card p-6">
          <h2 className="text-[15px] font-bold">{t('dex.matchups')}</h2>
          <div className="mt-4 space-y-3">
            <MatchupRow label="×4" types={profile.x4} />
            <MatchupRow label="×2" types={profile.x2} />
            <MatchupRow label="×0.5" types={profile.x05} />
            <MatchupRow label="×0.25" types={profile.x025} />
            <MatchupRow label="×0" types={profile.x0} />
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('dex.matchupNote')}</p>
        </section>
      </div>

      {/* Learnset */}
      <section className="card p-6">
        <h2 className="text-[15px] font-bold">{t('dex.learnset')}</h2>
        <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-600">{t('dex.learnsetNote')}</p>
        {!learnsetMoves && <div className="mt-4 h-40 animate-pulse rounded-xl bg-zinc-100 dark:bg-white/5" />}
        {learnsetMoves && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-zinc-200/70 text-left text-xs font-bold text-zinc-400 dark:border-white/8 dark:text-zinc-500">
                  <th className="py-2 pr-3 font-bold">{t('dex.move.name')}</th>
                  <th className="py-2 pr-3 font-bold">{t('dex.move.type')}</th>
                  <th className="py-2 pr-3 font-bold">{t('dex.move.category')}</th>
                  <th className="py-2 pr-3 text-right font-bold">{t('dex.move.power')}</th>
                  <th className="py-2 pr-3 text-right font-bold">{t('dex.move.accuracy')}</th>
                  <th className="py-2 text-right font-bold">PP</th>
                </tr>
              </thead>
              <tbody>
                {learnsetMoves.map((move) => (
                  <tr key={move.name} className="border-b border-zinc-100 last:border-0 dark:border-white/4">
                    <td className="py-2 pr-3 font-semibold">{i18n.language === 'ko' ? move.ko : move.name}</td>
                    <td className="py-2 pr-3">
                      <TypeBadge type={move.type} size="sm" />
                    </td>
                    <td className="py-2 pr-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      {t(`dex.category.${move.category.toLowerCase()}`)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{move.basePower || '—'}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{move.accuracy ?? '—'}</td>
                    <td className="py-2 text-right tabular-nums">{move.pp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
