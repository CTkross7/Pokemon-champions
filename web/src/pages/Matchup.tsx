import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadPokedex, type Species } from '@/lib/dex'
import { analyzeMatchup } from '@/lib/matchup'
import { useTeams } from '@/store/teams'
import SpeciesPicker from '@/components/SpeciesPicker'
import Sprite from '@/components/Sprite'
import TypeBadge from '@/components/TypeBadge'
import Icon from '@/components/Icon'

export default function Matchup() {
  const { t, i18n } = useTranslation()
  const ko = i18n.language === 'ko'
  const { teams, activeId } = useTeams()
  const [pokedex, setPokedex] = useState<Species[] | null>(null)
  const [teamId, setTeamId] = useState<string | null>(activeId)
  const [opponents, setOpponents] = useState<Species[]>([])

  useEffect(() => {
    loadPokedex().then(setPokedex, () => setPokedex([]))
  }, [])

  const speciesById = useMemo(() => new Map((pokedex ?? []).map((s) => [s.id, s])), [pokedex])
  const selectedTeam = teams.find((tm) => tm.id === (teamId ?? activeId)) ?? teams[0] ?? null
  const myTeam = useMemo(() => {
    if (!selectedTeam) return []
    return selectedTeam.mons
      .map((m) => (m ? speciesById.get(m.speciesId) : null))
      .filter((s): s is Species => Boolean(s))
  }, [selectedTeam, speciesById])

  const report = useMemo(
    () => (myTeam.length && opponents.length ? analyzeMatchup(myTeam, opponents) : null),
    [myTeam, opponents],
  )

  const addOpponent = (s: Species) => setOpponents((prev) => (prev.length >= 6 || prev.some((o) => o.id === s.id) ? prev : [...prev, s]))
  const removeOpponent = (id: string) => setOpponents((prev) => prev.filter((o) => o.id !== id))

  const name = (s: Species) => (ko ? s.ko : s.name)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">{t('matchup.title')}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('matchup.subtitle')}</p>
      </div>

      {/* My team selector */}
      {teams.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t('matchup.noTeam')}</p>
          <Link to="/teams" className="mt-3 inline-block text-sm font-bold text-volt-600 dark:text-volt-400">
            {t('matchup.goBuild')} →
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600">{t('matchup.myTeam')}</span>
          {teams.map((tm) => (
            <button
              key={tm.id}
              type="button"
              onClick={() => setTeamId(tm.id)}
              className={[
                'rounded-full px-3 py-1.5 text-sm font-bold transition-colors',
                (teamId ?? activeId) === tm.id
                  ? 'bg-zinc-900 text-white dark:bg-volt-400 dark:text-black'
                  : 'bg-zinc-100 text-zinc-500 dark:bg-white/6 dark:text-zinc-400',
              ].join(' ')}
            >
              {tm.name}
            </button>
          ))}
        </div>
      )}

      {/* Opponent input */}
      <div className="card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {t('matchup.opponent')}
          </h2>
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600">{opponents.length}/6</span>
        </div>
        {opponents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {opponents.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => removeOpponent(o.id)}
                className="flex items-center gap-1.5 rounded-full bg-zinc-100 py-0.5 pr-2 pl-0.5 dark:bg-white/6"
              >
                <Sprite species={o} size={24} />
                <span className="text-[11px] font-bold">{name(o)}</span>
                <span className="text-zinc-400">✕</span>
              </button>
            ))}
          </div>
        )}
        {opponents.length < 6 && <SpeciesPicker value={null} placeholder={t('matchup.addOpponent')} onChange={addOpponent} />}
      </div>

      {report && (
        <>
          {/* Recommended leads */}
          <section className="card p-5">
            <h2 className="text-[15px] font-bold">{t('matchup.leads')}</h2>
            <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-600">{t('matchup.leadsNote')}</p>
            <div className="mt-3 space-y-2">
              {report.leads.slice(0, 3).map(({ mon, offense, defense }, idx) => (
                <div key={mon.id} className="flex items-center gap-3 rounded-xl bg-zinc-50 p-2.5 dark:bg-white/4">
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-extrabold ${idx === 0 ? 'bg-volt-400 text-black' : 'bg-zinc-200 text-zinc-600 dark:bg-white/10 dark:text-zinc-300'}`}>
                    {idx + 1}
                  </span>
                  <Sprite species={mon} size={34} />
                  <span className="flex-1 text-sm font-bold">{name(mon)}</span>
                  <span className="flex gap-1">
                    {mon.types.map((tp) => (
                      <TypeBadge key={tp} type={tp} size="sm" />
                    ))}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    {t('matchup.offDef', { off: offense, def: defense })}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Threat ranking */}
          <section className="card p-5">
            <h2 className="text-[15px] font-bold">{t('matchup.threats')}</h2>
            <div className="mt-3 space-y-2">
              {report.threats.map(({ mon, pressures }) => (
                <div key={mon.id} className="flex items-center gap-3">
                  <Sprite species={mon} size={30} />
                  <span className="w-24 shrink-0 truncate text-sm font-bold">{name(mon)}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/6">
                    <div
                      className={`h-full rounded-full ${pressures >= 3 ? 'bg-red-500' : pressures >= 1 ? 'bg-orange-400' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                      style={{ width: `${Math.max(6, (pressures / Math.max(1, myTeam.length)) * 100)}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    {t('matchup.pressures', { count: pressures })}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Per-opponent answers */}
          <section className="card p-5">
            <h2 className="text-[15px] font-bold">{t('matchup.answers')}</h2>
            <div className="mt-3 space-y-2.5">
              {report.answers.map(({ opponent, answers, uncovered }) => (
                <div
                  key={opponent.id}
                  className={[
                    'rounded-xl border p-2.5',
                    uncovered ? 'border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10' : 'border-zinc-200 dark:border-white/8',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <Sprite species={opponent} size={26} />
                    <span className="text-sm font-bold">{name(opponent)}</span>
                    {uncovered && <span className="ml-auto text-[11px] font-extrabold text-red-500">{t('matchup.uncovered')}</span>}
                  </div>
                  {!uncovered && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {answers.slice(0, 4).map(({ mon, kind }) => (
                        <span key={mon.id} className="flex items-center gap-1 rounded-full bg-zinc-100 py-0.5 pr-2 pl-0.5 dark:bg-white/6">
                          <Sprite species={mon} size={20} />
                          <span className="text-[11px] font-bold">{name(mon)}</span>
                          <span className={`text-[9px] font-extrabold ${kind === 'defensive' ? 'text-sky-500' : 'text-volt-600 dark:text-volt-400'}`}>
                            {kind === 'both' ? t('matchup.both') : kind === 'offensive' ? t('coach.off') : t('coach.def')}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {!report && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-zinc-300 py-12 text-center dark:border-white/10">
          <Icon name="zap" size={28} className="text-zinc-300 dark:text-zinc-700" />
          <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t('matchup.prompt')}</p>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('matchup.disclaimer')}</p>
    </div>
  )
}
