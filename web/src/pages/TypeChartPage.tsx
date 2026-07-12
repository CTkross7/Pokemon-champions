import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { defensiveProfile, effectiveness, TYPES, TYPE_COLORS, TYPE_KO, type TypeName } from '@/lib/typechart'
import DexTabs from '@/components/DexTabs'
import TypeBadge from '@/components/TypeBadge'

function cellStyle(mult: number): { label: string; className: string } {
  if (mult === 2) return { label: '2', className: 'bg-emerald-500/90 text-white font-extrabold' }
  if (mult === 0.5) return { label: '½', className: 'bg-orange-400/90 text-white font-extrabold' }
  if (mult === 0) return { label: '0', className: 'bg-zinc-800 text-zinc-400 font-extrabold dark:bg-black' }
  return { label: '', className: 'text-zinc-300 dark:text-zinc-700' }
}

function TypeSummary({ type }: { type: TypeName }) {
  const { t } = useTranslation()
  const offense = {
    strong: TYPES.filter((d) => effectiveness(type, d) === 2),
    weak: TYPES.filter((d) => effectiveness(type, d) === 0.5),
    immune: TYPES.filter((d) => effectiveness(type, d) === 0),
  }
  const defense = defensiveProfile([type])

  const Row = ({ label, types }: { label: string; types: TypeName[] }) =>
    types.length === 0 ? null : (
      <div className="flex items-start gap-2.5">
        <span className="w-24 shrink-0 pt-0.5 text-xs font-bold text-zinc-500 dark:text-zinc-400">{label}</span>
        <div className="flex flex-wrap gap-1">
          {types.map((tp) => (
            <TypeBadge key={tp} type={tp} size="sm" />
          ))}
        </div>
      </div>
    )

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2.5">
        <h3 className="text-[13px] font-extrabold text-zinc-700 dark:text-zinc-200">{t('types.whenAttacking')}</h3>
        <Row label={t('types.superEffective')} types={offense.strong} />
        <Row label={t('types.notVeryEffective')} types={offense.weak} />
        <Row label={t('types.noEffect')} types={offense.immune} />
      </div>
      <div className="space-y-2.5">
        <h3 className="text-[13px] font-extrabold text-zinc-700 dark:text-zinc-200">{t('types.whenDefending')}</h3>
        <Row label={t('types.weakTo')} types={defense.x2} />
        <Row label={t('types.resists')} types={defense.x05} />
        <Row label={t('types.immuneTo')} types={defense.x0} />
      </div>
    </div>
  )
}

export default function TypeChartPage() {
  const { t, i18n } = useTranslation()
  const [selected, setSelected] = useState<TypeName>('Fire')
  const ko = i18n.language === 'ko'

  return (
    <div className="space-y-5">
      <DexTabs />

      {/* Type picker + summary */}
      <section className="card space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelected(type)}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-bold text-white transition-all',
                selected === type ? 'ring-2 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-black' : '',
              ].join(' ')}
              style={{
                backgroundColor: TYPE_COLORS[type],
                opacity: selected === type ? 1 : 0.55,
                textShadow: '0 1px 1px rgb(0 0 0 / 0.35)',
              }}
            >
              {ko ? TYPE_KO[type] : type}
            </button>
          ))}
        </div>
        <TypeSummary type={selected} />
      </section>

      {/* Full matrix */}
      <section className="card p-5 sm:p-6">
        <h2 className="text-[15px] font-bold">{t('types.fullChart')}</h2>
        <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-600">{t('types.fullChartHint')}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="border-separate border-spacing-0.5 text-center">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white p-1 text-[10px] font-bold text-zinc-400 dark:bg-card-dark dark:text-zinc-500">
                  {t('types.atkDef')}
                </th>
                {TYPES.map((def) => (
                  <th key={def} className="p-0">
                    <span
                      className="grid size-9 place-items-center rounded-md text-[9px] font-extrabold text-white"
                      style={{ backgroundColor: TYPE_COLORS[def], textShadow: '0 1px 1px rgb(0 0 0 / 0.35)' }}
                    >
                      {ko ? TYPE_KO[def] : def.slice(0, 3)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TYPES.map((atk) => (
                <tr key={atk}>
                  <th className="sticky left-0 z-10 bg-white p-0 dark:bg-card-dark">
                    <span
                      className="grid h-9 w-14 place-items-center rounded-md text-[10px] font-extrabold text-white"
                      style={{ backgroundColor: TYPE_COLORS[atk], textShadow: '0 1px 1px rgb(0 0 0 / 0.35)' }}
                    >
                      {ko ? TYPE_KO[atk] : atk.slice(0, 3)}
                    </span>
                  </th>
                  {TYPES.map((def) => {
                    const mult = effectiveness(atk, def)
                    const { label, className } = cellStyle(mult)
                    return (
                      <td key={def} className="p-0">
                        <span
                          className={`grid size-9 place-items-center rounded-md text-xs ${className} ${mult === 1 ? 'bg-zinc-50 dark:bg-white/3' : ''}`}
                        >
                          {label}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
