import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadPokedex, matchesQuery, type Species } from '@/lib/dex'
import { TYPES, TYPE_COLORS, TYPE_KO, type TypeName } from '@/lib/typechart'
import Sprite from '@/components/Sprite'
import TypeBadge from '@/components/TypeBadge'

interface SpeciesPickerProps {
  value: Species | null
  onChange: (species: Species) => void
  placeholder?: string
  championsFirst?: boolean
  /** Show a multi-select type-filter row (find a Pokemon by type when you forget its name). */
  typeFilter?: boolean
}

/** Searchable Pokemon selector backed by the static Pokedex. */
export default function SpeciesPicker({ value, onChange, placeholder, championsFirst, typeFilter }: SpeciesPickerProps) {
  const { t, i18n } = useTranslation()
  const [all, setAll] = useState<Species[] | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [types, setTypes] = useState<TypeName[]>([])
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPokedex().then(setAll, () => setAll([]))
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggleType = (tp: TypeName) =>
    setTypes((prev) => (prev.includes(tp) ? prev.filter((x) => x !== tp) : [...prev, tp]))

  const matches = useMemo(() => {
    if (!all) return []
    // Type filter is intersection (AND): a mon must have every selected type,
    // so picking 강철+비행 narrows straight to Steel/Flying dual-types.
    const list = all.filter(
      (s) => matchesQuery(s, query) && types.every((tp) => s.types.includes(tp)),
    )
    const sorted = championsFirst
      ? [...list].sort((a, b) => Number(b.champions) - Number(a.champions) || a.num - b.num)
      : list
    return sorted.slice(0, 40)
  }, [all, query, championsFirst, types])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-left text-sm font-bold outline-none focus:border-volt-500 dark:border-white/10 dark:bg-card-dark dark:focus:border-volt-400"
      >
        {value ? (
          <>
            <Sprite species={value} size={28} />
            <span className="truncate">{i18n.language === 'ko' ? value.ko : value.name}</span>
            <span className="ml-auto flex gap-1">
              {value.types.map((type) => (
                <TypeBadge key={type} type={type} size="sm" />
              ))}
            </span>
          </>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-600">{placeholder ?? t('calc.selectPokemon')}</span>
        )}
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lift dark:border-white/10 dark:bg-card-dark">
          <div className="p-2">
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('calc.searchPokemon')}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-volt-500 dark:border-white/10 dark:bg-black/40 dark:focus:border-volt-400"
            />
            {typeFilter && (
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600">{t('picker.typeFilter')}</span>
                  {types.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTypes([])}
                      className="text-[10px] font-bold text-volt-600 hover:underline dark:text-volt-400"
                    >
                      {t('picker.clear')}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {TYPES.map((tp) => {
                    const on = types.includes(tp)
                    return (
                      <button
                        key={tp}
                        type="button"
                        onClick={() => toggleType(tp)}
                        className={[
                          'rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-opacity',
                          on ? 'text-white' : 'text-zinc-500 opacity-60 hover:opacity-100 dark:text-zinc-300',
                        ].join(' ')}
                        style={{
                          backgroundColor: on ? TYPE_COLORS[tp] : 'transparent',
                          border: `1px solid ${TYPE_COLORS[tp]}`,
                        }}
                      >
                        {i18n.language === 'ko' ? (TYPE_KO[tp] ?? tp) : tp}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <ul className="max-h-72 overflow-y-auto pb-1">
            {matches.map((species) => (
              <li key={species.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(species)
                    setOpen(false)
                    setQuery('')
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-white/5"
                >
                  <Sprite species={species} size={26} />
                  <span className="truncate font-semibold">
                    {i18n.language === 'ko' ? species.ko : species.name}
                  </span>
                  {species.champions && (
                    <span className="rounded bg-volt-100 px-1 py-0.5 text-[9px] font-extrabold text-volt-800 dark:bg-volt-400/15 dark:text-volt-300">
                      PC
                    </span>
                  )}
                  <span className="ml-auto flex gap-1">
                    {species.types.map((type) => (
                      <TypeBadge key={type} type={type} size="sm" />
                    ))}
                  </span>
                </button>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-zinc-400">{t('dex.noResults')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
