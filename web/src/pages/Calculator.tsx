import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadLearnsets, loadMoves, type MoveData, type Species } from '@/lib/dex'
import {
  emptySp,
  COMMON_ITEMS,
  NATURES,
  natureLabel,
  WEATHERS,
  TERRAINS,
  type Nature,
  type SpAllocation,
  type Weather,
  type Terrain,
} from '@/lib/champions'
import {
  calcDamage,
  calcDamageUnknownDefender,
  listAbilities,
  type CalcResult,
  type FieldInput,
  type MonInput,
} from '@/lib/calc'
import SpeciesPicker from '@/components/SpeciesPicker'
import SpSliders from '@/components/SpSliders'
import TypeBadge from '@/components/TypeBadge'
import Icon from '@/components/Icon'

interface MonState {
  species: Species | null
  ability: string
  item: string
  nature: Nature
  sp: SpAllocation
}

const initialMon = (): MonState => ({ species: null, ability: '', item: '', nature: 'Serious', sp: emptySp() })

const selectClass =
  'h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs font-bold outline-none focus:border-volt-500 dark:border-white/10 dark:bg-card-dark dark:focus:border-volt-400'

function MonPanel({
  label,
  mon,
  onChange,
  unknownDefender,
  onToggleUnknown,
}: {
  label: string
  mon: MonState
  onChange: (mon: MonState) => void
  unknownDefender?: boolean
  onToggleUnknown?: (v: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  const abilities = useMemo(() => (mon.species ? listAbilities(mon.species.name) : []), [mon.species])

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-extrabold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">{label}</h2>
        {onToggleUnknown && (
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-bold text-zinc-500 select-none dark:text-zinc-400">
            <input
              type="checkbox"
              checked={unknownDefender}
              onChange={(e) => onToggleUnknown(e.target.checked)}
              className="size-3.5 accent-[--color-volt-500]"
            />
            {t('calc.unknownStats')}
          </label>
        )}
      </div>
      <SpeciesPicker
        value={mon.species}
        championsFirst
        onChange={(species) =>
          onChange({ ...mon, species, ability: listAbilities(species.name)[0] ?? '' })
        }
      />
      {mon.species && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600">{t('calc.ability')}</span>
              <select
                value={mon.ability}
                onChange={(e) => onChange({ ...mon, ability: e.target.value })}
                className={selectClass}
              >
                {abilities.length === 0 && <option value="">—</option>}
                {abilities.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600">{t('calc.item')}</span>
              <select
                value={mon.item}
                onChange={(e) => onChange({ ...mon, item: e.target.value })}
                className={selectClass}
              >
                {COMMON_ITEMS.map((it) => (
                  <option key={it.id} value={it.id}>
                    {i18n.language === 'ko' ? it.ko : it.id || '—'}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600">{t('calc.nature')}</span>
            <select
              value={mon.nature}
              onChange={(e) => onChange({ ...mon, nature: e.target.value as Nature })}
              className={selectClass}
            >
              {NATURES.map((n) => (
                <option key={n} value={n}>
                  {natureLabel(n, i18n.language)}
                </option>
              ))}
            </select>
          </label>
          {unknownDefender ? (
            <p className="rounded-lg bg-zinc-100 px-3 py-2 text-[11px] leading-relaxed text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
              {t('calc.unknownStatsNote')}
            </p>
          ) : (
            <SpSliders sp={mon.sp} onChange={(sp) => onChange({ ...mon, sp })} />
          )}
        </>
      )}
    </div>
  )
}

function toInput(mon: MonState): MonInput {
  return {
    species: mon.species!.name,
    ability: mon.ability,
    item: mon.item,
    nature: mon.nature,
    sp: mon.sp,
  }
}

function barColor(pct: number): string {
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 50) return 'bg-orange-400'
  if (pct >= 25) return 'bg-amber-400'
  return 'bg-volt-500'
}

export default function Calculator() {
  const { t, i18n } = useTranslation()
  const [attacker, setAttacker] = useState<MonState>(initialMon)
  const [defender, setDefender] = useState<MonState>(initialMon)
  const [unknownDefender, setUnknownDefender] = useState(true)
  const [field, setField] = useState<FieldInput>({ weather: '', terrain: '' })
  const [moves, setMoves] = useState<Record<string, MoveData> | null>(null)
  const [learnsets, setLearnsets] = useState<Record<string, string[]> | null>(null)
  const [selectedMoves, setSelectedMoves] = useState<string[]>([])

  useEffect(() => {
    Promise.all([loadMoves(), loadLearnsets()]).then(([m, ls]) => {
      setMoves(m)
      setLearnsets(ls)
    })
  }, [])

  // Reset move selection when attacker changes
  useEffect(() => {
    setSelectedMoves([])
  }, [attacker.species?.id])

  const attackerMoves = useMemo(() => {
    if (!attacker.species || !moves || !learnsets) return []
    const ids = learnsets[attacker.species.id] ?? []
    return ids
      .map((id) => ({ id, move: moves[id] }))
      .filter((x) => x.move && x.move.category !== 'Status' && x.move.basePower > 0)
      .sort((a, b) => a.move.type.localeCompare(b.move.type) || b.move.basePower - a.move.basePower)
  }, [attacker.species, moves, learnsets])

  const results = useMemo(() => {
    if (!attacker.species || !defender.species) return []
    return selectedMoves.map((moveId) => {
      const move = moves?.[moveId]
      if (!move) return { moveId, move, result: null as CalcResult | null, range: null }
      if (unknownDefender) {
        const { sp: _sp, ...defBase } = toInput(defender)
        const span = calcDamageUnknownDefender(toInput(attacker), defBase, move.name, move.category, field)
        // "worst" = vs max-invest (lower %), "best" = vs 0-invest (upper %)
        return {
          moveId,
          move,
          result: span?.best ?? null,
          range: span ? { min: span.worst.maxPercent, max: span.best.maxPercent, worst: span.worst, best: span.best } : null,
        }
      }
      return { moveId, move, result: calcDamage(toInput(attacker), toInput(defender), move.name, field), range: null }
    })
  }, [attacker, defender, unknownDefender, selectedMoves, moves, field])

  const toggleMove = (id: string) =>
    setSelectedMoves((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : prev.length >= 4 ? prev : [...prev, id],
    )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">{t('calc.title')}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('calc.subtitle')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonPanel label={t('calc.attacker')} mon={attacker} onChange={setAttacker} />
        <MonPanel
          label={t('calc.defender')}
          mon={defender}
          onChange={setDefender}
          unknownDefender={unknownDefender}
          onToggleUnknown={setUnknownDefender}
        />
      </div>

      {/* Field */}
      <div className="card flex flex-wrap items-center gap-4 p-4">
        <span className="text-xs font-extrabold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          {t('calc.field')}
        </span>
        <label className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600">{t('calc.weather')}</span>
          <select
            value={field.weather}
            onChange={(e) => setField({ ...field, weather: e.target.value as Weather })}
            className={`${selectClass} w-auto`}
          >
            {WEATHERS.map((w) => (
              <option key={w} value={w}>
                {w ? t(`calc.weathers.${w}`) : '—'}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600">{t('calc.terrain')}</span>
          <select
            value={field.terrain}
            onChange={(e) => setField({ ...field, terrain: e.target.value as Terrain })}
            className={`${selectClass} w-auto`}
          >
            {TERRAINS.map((tr) => (
              <option key={tr} value={tr}>
                {tr ? t(`calc.terrains.${tr}`) : '—'}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Move selection */}
      {attacker.species && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              {t('calc.moves')}
            </h2>
            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600">{selectedMoves.length}/4</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {attackerMoves.map(({ id, move }) => {
              const active = selectedMoves.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleMove(id)}
                  className={[
                    'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors',
                    active
                      ? 'border-volt-500 bg-volt-400/15 text-volt-700 dark:border-volt-400/60 dark:text-volt-300'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-white/10 dark:text-zinc-300',
                  ].join(' ')}
                >
                  <TypeBadge type={move.type} size="sm" />
                  {i18n.language === 'ko' ? move.ko : move.name}
                  <span className="text-zinc-400 dark:text-zinc-600">{move.basePower}</span>
                </button>
              )
            })}
            {attackerMoves.length === 0 && (
              <span className="text-xs text-zinc-400">{t('calc.noMoves')}</span>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map(({ moveId, move, result, range }) => {
            const hasDamage = result && result.maxPercent > 0
            return (
              <div key={moveId} className="card p-4">
                <div className="flex items-center gap-2">
                  {move && <TypeBadge type={move.type} />}
                  <span className="font-bold">{move && (i18n.language === 'ko' ? move.ko : move.name)}</span>
                  {hasDamage && (
                    <span className="ml-auto text-lg font-extrabold tabular-nums">
                      {range ? `${range.min}–${range.max}%` : `${result.minPercent}–${result.maxPercent}%`}
                    </span>
                  )}
                </div>
                {hasDamage ? (
                  <>
                    {range ? (
                      // Unknown-defender: shaded band from worst-case (max invest) to
                      // best-case (0 invest), so the guaranteed floor is visible.
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/6">
                        <div className="relative h-full">
                          <div
                            className="absolute h-full rounded-full bg-volt-400/30"
                            style={{ left: 0, width: `${Math.min(100, range.max)}%` }}
                          />
                          <div
                            className={`absolute h-full rounded-full ${barColor(range.min)}`}
                            style={{ width: `${Math.min(100, range.min)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/6">
                        <div
                          className={`h-full rounded-full ${barColor(result.maxPercent)}`}
                          style={{ width: `${Math.min(100, result.maxPercent)}%` }}
                        />
                      </div>
                    )}
                    {range ? (
                      <div className="mt-2 space-y-0.5 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                        <p>
                          <span className="font-bold text-zinc-500 dark:text-zinc-400">{t('calc.vsMaxBulk')}:</span>{' '}
                          {range.worst.minPercent}–{range.worst.maxPercent}%
                          {range.worst.koChance && <span className="ml-1 text-zinc-400">({range.worst.koChance})</span>}
                        </p>
                        <p>
                          <span className="font-bold text-zinc-500 dark:text-zinc-400">{t('calc.vsMinBulk')}:</span>{' '}
                          {range.best.minPercent}–{range.best.maxPercent}%
                          {range.best.koChance && <span className="ml-1 text-zinc-400">({range.best.koChance})</span>}
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">{result.desc}</p>
                        {result.koChance && (
                          <p className="mt-1 text-xs font-bold text-volt-600 dark:text-volt-400">{result.koChance}</p>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-zinc-400">{t('calc.noDamage')}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {(!attacker.species || !defender.species) && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-zinc-300 py-12 text-center dark:border-white/10">
          <Icon name="calc" size={28} className="text-zinc-300 dark:text-zinc-700" />
          <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t('calc.pickBoth')}</p>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('calc.disclaimer')}</p>
    </div>
  )
}
