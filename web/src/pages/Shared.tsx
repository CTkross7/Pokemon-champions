import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadMoves, loadPokedex, type MoveData, type Species } from '@/lib/dex'
import { spTotal } from '@/lib/champions'
import { decodeTeam, type DecodedTeam } from '@/lib/share'
import { useTeams } from '@/store/teams'
import Sprite from '@/components/Sprite'
import TypeBadge from '@/components/TypeBadge'
import Icon from '@/components/Icon'

export default function Shared() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { importTeam } = useTeams()
  const [pokedex, setPokedex] = useState<Species[] | null>(null)
  const [moves, setMoves] = useState<Record<string, MoveData> | null>(null)

  const decoded = useMemo<DecodedTeam | null>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const m = hash.match(/[#&]s=([^&]+)/)
    return m ? decodeTeam(m[1]) : null
  }, [])

  useEffect(() => {
    loadPokedex().then(setPokedex, () => setPokedex([]))
    loadMoves().then(setMoves)
  }, [])

  const speciesById = useMemo(() => new Map((pokedex ?? []).map((s) => [s.id, s])), [pokedex])
  const name = (s: Species) => (i18n.language === 'ko' ? s.ko : s.name)

  const copyToMyTeams = () => {
    if (!decoded) return
    importTeam({
      id: crypto.randomUUID(),
      name: `${decoded.name} (${t('shared.copied')})`,
      mons: decoded.mons,
      updatedAt: Date.now(),
    })
    navigate('/teams')
  }

  if (!decoded) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm font-semibold text-zinc-500">{t('shared.invalid')}</p>
        <Link to="/teams" className="mt-4 inline-block text-sm font-bold text-volt-600 dark:text-volt-400">
          {t('shared.goTeams')} →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-600">{t('shared.sharedTeam')}</p>
          <h1 className="text-2xl font-extrabold tracking-tight">{decoded.name}</h1>
        </div>
        <button
          type="button"
          onClick={copyToMyTeams}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-volt-400 px-5 text-sm font-bold text-black transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          <Icon name="users" size={16} />
          {t('shared.copyToMine')}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {decoded.mons.map((mon, i) => {
          const species = mon ? speciesById.get(mon.speciesId) : null
          if (!mon || !species) return null
          return (
            <div key={i} className="card p-4">
              <div className="flex items-center gap-2">
                <Sprite species={species} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{name(species)}</p>
                  <div className="flex gap-1">
                    {species.types.map((tp) => (
                      <TypeBadge key={tp} type={tp} size="sm" />
                    ))}
                  </div>
                </div>
              </div>
              <dl className="mt-3 space-y-1 text-[11px]">
                {mon.ability && (
                  <div className="flex justify-between">
                    <dt className="text-zinc-400 dark:text-zinc-600">{t('calc.ability')}</dt>
                    <dd className="font-bold">{mon.ability}</dd>
                  </div>
                )}
                {mon.item && (
                  <div className="flex justify-between">
                    <dt className="text-zinc-400 dark:text-zinc-600">{t('calc.item')}</dt>
                    <dd className="font-bold">{mon.item}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-zinc-400 dark:text-zinc-600">{t('calc.nature')}</dt>
                  <dd className="font-bold">{mon.nature}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-400 dark:text-zinc-600">SP</dt>
                  <dd className="font-bold">{spTotal(mon.sp)}/66</dd>
                </div>
              </dl>
              {mon.moves.length > 0 && moves && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {mon.moves.map((id) => {
                    const mv = moves[id]
                    return mv ? (
                      <span key={id} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold dark:bg-white/6">
                        {i18n.language === 'ko' ? mv.ko : mv.name}
                      </span>
                    ) : null
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('shared.note')}</p>
    </div>
  )
}
