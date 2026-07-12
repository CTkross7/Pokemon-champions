import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { recommendBuilds } from '@/lib/builds'
import { COMMON_ITEMS, STAT_KEYS } from '@/lib/champions'
import { useTeams, type TeamMon } from '@/store/teams'
import type { MoveData, Species } from '@/lib/dex'
import TypeBadge from '@/components/TypeBadge'

const ROLE_KEY: Record<string, string> = {
  physical: 'coach.roles.physical',
  special: 'coach.roles.special',
  bulky: 'coach.roles.wall',
}

export default function BuildRecs({
  species,
  learnset,
  moves,
}: {
  species: Species
  learnset: string[]
  moves: Record<string, MoveData>
}) {
  const { t, i18n } = useTranslation()
  const { teams, activeId, createTeam, setMon } = useTeams()
  const [added, setAdded] = useState<number | null>(null)
  const builds = useMemo(() => recommendBuilds(species, learnset, moves), [species, learnset, moves])
  const itemKo = (id: string) => COMMON_ITEMS.find((it) => it.id === id)?.ko ?? id

  if (builds.length === 0) return null

  const addToTeam = (build: (typeof builds)[number], idx: number) => {
    let teamId = activeId ?? teams[0]?.id ?? null
    if (!teamId) teamId = createTeam()
    const team = useTeams.getState().teams.find((tm) => tm.id === teamId)
    const slot = team ? team.mons.findIndex((m) => m === null) : 0
    const mon: TeamMon = {
      speciesId: species.id,
      ability: species.abilities[0]?.name ?? '',
      item: build.item,
      nature: build.nature,
      sp: build.sp,
      moves: build.moves,
    }
    setMon(teamId, slot < 0 ? 5 : slot, mon)
    setAdded(idx)
    setTimeout(() => setAdded(null), 2500)
  }

  return (
    <section className="card p-6">
      <h2 className="text-[15px] font-bold">{t('builds.title')}</h2>
      <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-600">{t('builds.note')}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {builds.map((build, idx) => (
          <div key={build.roleKey} className="rounded-xl border border-zinc-200 p-4 dark:border-white/8">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-volt-100 px-2.5 py-1 text-[11px] font-extrabold text-volt-800 dark:bg-volt-400/15 dark:text-volt-300">
                {t(ROLE_KEY[build.roleKey])}
              </span>
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600">{build.nature}</span>
            </div>
            <dl className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <dt className="text-zinc-400 dark:text-zinc-600">{t('calc.item')}</dt>
                <dd className="font-bold">{i18n.language === 'ko' ? itemKo(build.item) : build.item}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-400 dark:text-zinc-600">SP</dt>
                <dd className="font-bold">
                  {STAT_KEYS.filter((k) => build.sp[k] > 0)
                    .map((k) => `${t(`dex.stats.${k}`)} ${build.sp[k]}`)
                    .join(' / ')}
                </dd>
              </div>
            </dl>
            <div className="mt-2 flex flex-wrap gap-1">
              {build.moves.map((id) => {
                const mv = moves[id]
                return mv ? (
                  <span key={id} className="flex items-center gap-1 rounded-full bg-zinc-100 py-0.5 pr-2 pl-0.5 dark:bg-white/6">
                    <TypeBadge type={mv.type} size="sm" />
                    <span className="text-[10px] font-bold">{i18n.language === 'ko' ? mv.ko : mv.name}</span>
                  </span>
                ) : null
              })}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              {t(`builds.reason.${build.reasonKey}`)}
            </p>
            <button
              type="button"
              onClick={() => addToTeam(build, idx)}
              className="mt-3 w-full rounded-lg bg-zinc-900 py-2 text-xs font-bold text-white transition-colors dark:bg-volt-400 dark:text-black"
            >
              {added === idx ? t('builds.added') : t('builds.addToTeam')}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
