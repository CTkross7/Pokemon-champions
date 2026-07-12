import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { analyzeTeam, type ResolvedMon } from '@/lib/coach'
import { TYPE_KO, type TypeName } from '@/lib/typechart'
import type { MoveData, Species } from '@/lib/dex'
import TypeBadge from '@/components/TypeBadge'
import Sprite from '@/components/Sprite'

const ROLE_KEY: Record<string, string> = {
  physical: 'coach.roles.physical',
  special: 'coach.roles.special',
  mixed: 'coach.roles.mixed',
  wall: 'coach.roles.wall',
  support: 'coach.roles.support',
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? '#b8db10' : score >= 50 ? '#f0c320' : '#ef4444'
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid size-24 shrink-0 place-items-center">
      <svg viewBox="0 0 80 80" className="size-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-zinc-200 dark:text-white/10" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <span className="absolute text-2xl font-extrabold tabular-nums">{score}</span>
    </div>
  )
}

export default function TeamCoach({
  team,
  moves,
  metaRoster,
}: {
  team: ResolvedMon[]
  moves: Record<string, MoveData>
  metaRoster: Species[]
}) {
  const { t, i18n } = useTranslation()
  const ko = i18n.language === 'ko'
  const report = useMemo(() => analyzeTeam(team, moves, metaRoster), [team, moves, metaRoster])

  const label = (type: TypeName) => (ko ? TYPE_KO[type] : type)

  const renderSuggestion = (s: string) => {
    const [kind, payload] = s.split(':')
    switch (kind) {
      case 'weakness':
        return t('coach.sug.weakness', { types: payload.split(',').map((x) => label(x as TypeName)).join(', ') })
      case 'coverage':
        return t('coach.sug.coverage', { types: payload.split(',').map((x) => label(x as TypeName)).join(', ') })
      case 'threats': {
        const names = payload
          .split(',')
          .map((id) => {
            const sp = metaRoster.find((m) => m.id === id)
            return sp ? (ko ? sp.ko : sp.name) : id
          })
          .join(', ')
        return t('coach.sug.threats', { names })
      }
      case 'speed':
        return t('coach.sug.speed')
      case 'role':
        return t('coach.sug.role')
      default:
        return s
    }
  }

  if (team.length === 0) return null

  const handledCount = report.metaThreats.filter((m) => m.handled).length

  return (
    <section className="card space-y-6 p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <ScoreRing score={report.score} />
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">{t('coach.title')}</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('coach.scoreNote')}</p>
          <p className="mt-1 text-xs font-bold text-zinc-400 dark:text-zinc-600">
            {t('coach.threatCoverage', { handled: handledCount, total: report.metaThreats.length })}
          </p>
        </div>
      </div>

      {/* Weaknesses */}
      <div>
        <h3 className="text-[13px] font-extrabold text-zinc-700 dark:text-zinc-200">{t('coach.weakHoles')}</h3>
        {report.weaknesses.length === 0 ? (
          <p className="mt-1.5 text-sm text-volt-600 dark:text-volt-400">{t('coach.noHoles')}</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {report.weaknesses.map((w) => (
              <span key={w.type} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-1 dark:bg-red-500/10">
                <TypeBadge type={w.type} size="sm" />
                <span className="pr-1 text-[11px] font-bold text-red-600 dark:text-red-400">×{w.weakCount}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Offensive coverage gaps */}
      <div>
        <h3 className="text-[13px] font-extrabold text-zinc-700 dark:text-zinc-200">{t('coach.coverageGaps')}</h3>
        {report.missingCoverage.length === 0 ? (
          <p className="mt-1.5 text-sm text-volt-600 dark:text-volt-400">{t('coach.fullCoverage')}</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1">
            {report.missingCoverage.map((tp) => (
              <TypeBadge key={tp} type={tp} size="sm" />
            ))}
          </div>
        )}
      </div>

      {/* Role balance */}
      <div>
        <h3 className="text-[13px] font-extrabold text-zinc-700 dark:text-zinc-200">{t('coach.roleBalance')}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {report.roles.map(({ mon, role }) => (
            <span key={mon.species.id} className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 py-0.5 pr-2.5 pl-0.5 dark:bg-white/6">
              <Sprite species={mon.species} size={24} />
              <span className="text-[11px] font-bold">{t(ROLE_KEY[role])}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Meta threat coverage */}
      <div>
        <h3 className="text-[13px] font-extrabold text-zinc-700 dark:text-zinc-200">{t('coach.metaThreats')}</h3>
        <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-600">{t('coach.metaNote')}</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {report.metaThreats
            .slice()
            .sort((a, b) => Number(a.handled) - Number(b.handled))
            .map(({ species, handled, reason }) => (
              <div
                key={species.id}
                className={[
                  'flex items-center gap-1.5 rounded-lg border px-2 py-1',
                  handled
                    ? 'border-zinc-200 dark:border-white/8'
                    : 'border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10',
                ].join(' ')}
              >
                <Sprite species={species} size={22} />
                <span className="min-w-0 flex-1 truncate text-[11px] font-bold">{ko ? species.ko : species.name}</span>
                <span className={`text-[10px] font-extrabold ${handled ? 'text-volt-600 dark:text-volt-400' : 'text-red-500'}`}>
                  {handled ? (reason === 'offensive' ? t('coach.off') : t('coach.def')) : t('coach.gap')}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Suggestions */}
      {report.suggestions.length > 0 && (
        <div className="rounded-xl bg-volt-400/10 p-4 dark:bg-volt-400/8">
          <h3 className="text-[13px] font-extrabold text-volt-700 dark:text-volt-300">{t('coach.suggestions')}</h3>
          <ul className="mt-2 space-y-1.5">
            {report.suggestions.map((s) => (
              <li key={s} className="flex gap-2 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-200">
                <span className="text-volt-500">›</span>
                {renderSuggestion(s)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
