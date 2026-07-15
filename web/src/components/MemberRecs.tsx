import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { analyzeTeam, type ResolvedMon } from '@/lib/coach'
import { recommendMembers } from '@/lib/recommend'
import type { MoveData, Species } from '@/lib/dex'
import type { UsageData } from '@/lib/stats'
import Sprite from '@/components/Sprite'
import TypeBadge from '@/components/TypeBadge'
import Icon from '@/components/Icon'

/**
 * "추천 멤버" — ranked Pokemon to ADD to the current team, patching its
 * weaknesses / unhandled threats and favouring real co-usage partners. Tapping
 * a suggestion drops it into the first empty slot.
 */
export default function MemberRecs({
  team,
  moves,
  metaRoster,
  pokedex,
  usage,
  speciesById,
  onAdd,
  canAdd,
}: {
  team: ResolvedMon[]
  moves: Record<string, MoveData>
  metaRoster: Species[]
  pokedex: Species[]
  usage: UsageData | null
  speciesById: Map<string, Species>
  onAdd: (s: Species) => void
  canAdd: boolean
}) {
  const { t, i18n } = useTranslation()
  const ko = i18n.language === 'ko'
  const name = (s: Species) => (ko ? s.ko : s.name)

  const report = useMemo(() => analyzeTeam(team, moves, metaRoster), [team, moves, metaRoster])
  const recs = useMemo(
    () => recommendMembers(team.map((m) => m.species.id), report, pokedex, usage, 10),
    [team, report, pokedex, usage],
  )

  const reason = (key: string): string => {
    const [kind, partnerId, rank] = key.split(':')
    switch (kind) {
      case 'synergy': {
        const partner = speciesById.get(partnerId)
        return t('recommend.reason.synergy', { name: partner ? name(partner) : partnerId, rank })
      }
      case 'weakness':
        return t('recommend.reason.weakness')
      case 'threat':
        return t('recommend.reason.threat')
      case 'coverage':
        return t('recommend.reason.coverage')
      default:
        return t('recommend.reason.meta')
    }
  }

  if (recs.length === 0) return null

  return (
    <section className="card p-5">
      <div className="flex items-center gap-2">
        <Icon name="sparkles" size={16} className="text-volt-500 dark:text-volt-400" />
        <h2 className="text-[15px] font-bold">{t('recommend.title')}</h2>
      </div>
      <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-600">{t('recommend.subtitle')}</p>
      <div className="mt-3 space-y-1.5">
        {recs.map((rec, idx) => (
          <button
            key={rec.species.id}
            type="button"
            onClick={() => canAdd && onAdd(rec.species)}
            disabled={!canAdd}
            className="flex w-full items-center gap-3 rounded-xl bg-zinc-50 p-2 text-left transition-colors enabled:hover:bg-volt-400/10 disabled:cursor-default dark:bg-white/4 dark:enabled:hover:bg-volt-400/10"
          >
            <span className="w-4 shrink-0 text-center text-[11px] font-extrabold text-zinc-400 dark:text-zinc-600">
              {idx + 1}
            </span>
            <Sprite species={rec.species} size={34} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-bold">{name(rec.species)}</span>
                <span className="flex gap-1">
                  {rec.species.types.map((tp) => (
                    <TypeBadge key={tp} type={tp} size="sm" />
                  ))}
                </span>
              </div>
              <p className="truncate text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{reason(rec.reasonKey)}</p>
            </div>
            <span className="shrink-0 text-right text-[11px] font-extrabold text-volt-600 tabular-nums dark:text-volt-400">
              {rec.score}
            </span>
            {canAdd && <Icon name="chevronRight" size={14} className="shrink-0 text-zinc-400" />}
          </button>
        ))}
      </div>
    </section>
  )
}
