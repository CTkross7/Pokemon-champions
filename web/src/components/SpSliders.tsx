import { useTranslation } from 'react-i18next'
import { clampSp, spTotal, STAT_KEYS, SP_TOTAL_MAX, SP_PER_STAT_MAX, type SpAllocation } from '@/lib/champions'

interface SpSlidersProps {
  sp: SpAllocation
  onChange: (sp: SpAllocation) => void
}

export default function SpSliders({ sp, onChange }: SpSlidersProps) {
  const { t } = useTranslation()
  const total = spTotal(sp)
  const remaining = SP_TOTAL_MAX - total

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-zinc-500 dark:text-zinc-400">SP</span>
        <span className={remaining === 0 ? 'text-volt-600 dark:text-volt-400' : 'text-zinc-500 dark:text-zinc-400'}>
          {total} / {SP_TOTAL_MAX}
          <span className="ml-1 font-medium text-zinc-400 dark:text-zinc-600">
            ({t('calc.spRemaining', { count: remaining })})
          </span>
        </span>
      </div>
      {STAT_KEYS.map((key) => (
        <div key={key} className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
            {t(`dex.stats.${key}`)}
          </span>
          <input
            type="range"
            min={0}
            max={SP_PER_STAT_MAX}
            value={sp[key]}
            onChange={(e) => onChange(clampSp(sp, key, Number(e.target.value)))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-[--color-volt-500] dark:bg-white/10"
          />
          <input
            type="number"
            min={0}
            max={SP_PER_STAT_MAX}
            value={sp[key]}
            onChange={(e) => onChange(clampSp(sp, key, Number(e.target.value)))}
            className="w-11 shrink-0 rounded-md border border-zinc-200 bg-white px-1 py-0.5 text-center text-xs font-bold tabular-nums outline-none focus:border-volt-500 dark:border-white/10 dark:bg-black/40 dark:focus:border-volt-400"
          />
        </div>
      ))}
    </div>
  )
}
