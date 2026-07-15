import { useTranslation } from 'react-i18next'
import {
  clampSp,
  spTotal,
  STAT_KEYS,
  SP_TOTAL_MAX,
  SP_PER_STAT_MAX,
  NATURE_EFFECTS,
  type SpAllocation,
  type Nature,
} from '@/lib/champions'

interface SpSlidersProps {
  sp: SpAllocation
  onChange: (sp: SpAllocation) => void
  nature?: Nature
}

export default function SpSliders({ sp, onChange, nature }: SpSlidersProps) {
  const { t } = useTranslation()
  const total = spTotal(sp)
  const remaining = SP_TOTAL_MAX - total
  const eff = nature ? NATURE_EFFECTS[nature] : undefined

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
      {STAT_KEYS.map((key) => {
        const up = eff?.plus === key
        const down = eff?.minus === key
        return (
        <div key={key} className="flex items-center gap-2">
          <span
            className={[
              'flex w-14 shrink-0 items-center gap-0.5 text-[11px] font-bold',
              up
                ? 'text-emerald-600 dark:text-emerald-400'
                : down
                  ? 'text-rose-500 dark:text-rose-400'
                  : 'text-zinc-500 dark:text-zinc-400',
            ].join(' ')}
          >
            {t(`dex.stats.${key}`)}
            {up && <span className="text-[9px] leading-none" aria-label="nature up">▲</span>}
            {down && <span className="text-[9px] leading-none" aria-label="nature down">▼</span>}
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
        )
      })}
    </div>
  )
}
