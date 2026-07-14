import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadPokedex, matchesQuery, statTotal, type Species } from '@/lib/dex'
import { TYPES, TYPE_COLORS, TYPE_KO } from '@/lib/typechart'
import { useDexFilters, type DexSortKey } from '@/store/dexFilters'
import DexTabs from '@/components/DexTabs'
import Sprite from '@/components/Sprite'
import TypeBadge from '@/components/TypeBadge'
import Icon from '@/components/Icon'

const PAGE_SIZE = 60

const SORT_OPTIONS: DexSortKey[] = ['num', 'total', 'hp', 'atk', 'def', 'spa', 'spd', 'spe']

export default function Dex() {
  const { t, i18n } = useTranslation()
  const [all, setAll] = useState<Species[] | null>(null)
  const [error, setError] = useState(false)
  // Filter state lives in a store so it survives leaving/returning to this tab.
  const { query, typeFilter, includeFormes, sort, limit, set, reset } = useDexFilters()
  const filtersActive = query.trim() !== '' || typeFilter !== null || sort !== 'num' || !includeFormes

  useEffect(() => {
    loadPokedex().then(setAll, () => setError(true))
  }, [])

  const filtered = useMemo(() => {
    if (!all) return []
    const q = query.trim()
    let list = all.filter((s) => matchesQuery(s, q))
    // Hide alternate formes (megas/regional) unless explicitly shown or searched
    if (!includeFormes && !q) list = list.filter((s) => !s.forme)
    if (typeFilter) list = list.filter((s) => s.types.includes(typeFilter))
    if (sort !== 'num') {
      list = [...list].sort((a, b) =>
        sort === 'total' ? statTotal(b) - statTotal(a) : b.baseStats[sort] - a.baseStats[sort],
      )
    }
    return list
  }, [all, query, typeFilter, includeFormes, sort])

  const visible = filtered.slice(0, limit)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DexTabs />
        <div className="flex items-center gap-2">
          {filtersActive && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-bold text-zinc-500 transition-colors hover:border-volt-500 hover:text-volt-700 dark:border-white/10 dark:text-zinc-400 dark:hover:border-volt-400/60 dark:hover:text-volt-300"
            >
              {t('dex.resetFilters')}
            </button>
          )}
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            {all ? t('dex.results', { count: filtered.length }) : ''}
          </span>
        </div>
      </div>

      {/* Search + controls */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => set({ query: e.target.value, limit: PAGE_SIZE })}
            placeholder={t('dex.searchPlaceholder')}
            className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pr-4 pl-11 text-[15px] font-medium outline-none placeholder:text-zinc-400 focus:border-volt-500 dark:border-white/10 dark:bg-card-dark dark:placeholder:text-zinc-600 dark:focus:border-volt-400"
          />
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400">
            <Icon name="book" size={17} />
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => set({ typeFilter: null })}
            className={[
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
              typeFilter === null
                ? 'bg-zinc-900 text-white dark:bg-volt-400 dark:text-black'
                : 'bg-zinc-100 text-zinc-500 dark:bg-white/6 dark:text-zinc-400',
            ].join(' ')}
          >
            {t('dex.filterAll')}
          </button>
          {TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set({ typeFilter: typeFilter === type ? null : type, limit: PAGE_SIZE })}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-white transition-opacity"
              style={{
                backgroundColor: TYPE_COLORS[type],
                opacity: typeFilter === null || typeFilter === type ? 1 : 0.35,
                textShadow: '0 1px 1px rgb(0 0 0 / 0.35)',
              }}
            >
              {i18n.language === 'ko' ? TYPE_KO[type] : type}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 select-none has-checked:border-volt-500 has-checked:text-volt-700 dark:border-white/10 dark:text-zinc-400 dark:has-checked:border-volt-400/60 dark:has-checked:text-volt-300">
            <input
              type="checkbox"
              checked={includeFormes}
              onChange={(e) => set({ includeFormes: e.target.checked, limit: PAGE_SIZE })}
              className="size-3.5 accent-[--color-volt-500]"
            />
            {t('dex.includeFormes')}
          </label>
          <select
            value={sort}
            onChange={(e) => set({ sort: e.target.value as DexSortKey })}
            className="ml-auto h-8 rounded-full border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-600 outline-none dark:border-white/10 dark:bg-card-dark dark:text-zinc-300"
            aria-label={t('dex.sortLabel')}
          >
            {SORT_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {t(`dex.sort.${key}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {error && <p className="py-16 text-center text-sm text-zinc-500">{t('dex.loadError')}</p>}
      {!all && !error && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="card h-36 animate-pulse" />
          ))}
        </div>
      )}
      {all && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((species) => (
              <Link
                key={species.id}
                to={`/dex/${species.id}`}
                className="group card flex flex-col items-center p-4 text-center transition-all duration-150 hover:-translate-y-0.5 hover:border-volt-500/60 hover:shadow-lift dark:hover:border-volt-400/40"
              >
                <div className="flex w-full items-start justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600">
                    #{String(species.num).padStart(4, '0')}
                  </span>
                  {species.tier && (
                    <span
                      className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-extrabold text-zinc-500 dark:bg-white/8 dark:text-zinc-400"
                      title={t('dex.tierBadge')}
                    >
                      {species.tier}
                    </span>
                  )}
                </div>
                <Sprite species={species} size={72} className="transition-transform duration-150 group-hover:scale-110" />
                <p className="mt-1 w-full truncate text-sm font-bold">
                  {i18n.language === 'ko' ? species.ko : species.name}
                </p>
                <p className="w-full truncate text-[10px] font-medium text-zinc-400 dark:text-zinc-600">
                  {i18n.language === 'ko' ? species.name : species.ko}
                </p>
                <div className="mt-2 flex gap-1">
                  {species.types.map((type) => (
                    <TypeBadge key={type} type={type} size="sm" />
                  ))}
                </div>
              </Link>
            ))}
          </div>
          {filtered.length > limit && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => set({ limit: limit + PAGE_SIZE })}
                className="inline-flex h-10 items-center rounded-full border border-zinc-300 px-6 text-sm font-bold text-zinc-600 transition-colors hover:border-volt-500 hover:text-volt-700 dark:border-white/15 dark:text-zinc-300 dark:hover:border-volt-400/60 dark:hover:text-volt-300"
              >
                {t('dex.loadMore', { count: filtered.length - limit })}
              </button>
            </div>
          )}
          {filtered.length === 0 && <p className="py-16 text-center text-sm text-zinc-500">{t('dex.noResults')}</p>}
        </>
      )}

      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('dex.rosterNote')}</p>
    </div>
  )
}
