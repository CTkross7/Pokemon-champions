import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadLearnsets, loadMoves, loadPokedex, type MoveData, type Species } from '@/lib/dex'
import { statAtLevel50, spTotal, NATURES, COMMON_ITEMS, type Nature } from '@/lib/champions'
import { listAbilities } from '@/lib/calc'
import { exportTeam, importTeam } from '@/lib/showdown'
import { shareUrl } from '@/lib/share'
import { useTeams, emptyMon, type TeamMon } from '@/store/teams'
import SpeciesPicker from '@/components/SpeciesPicker'
import SpSliders from '@/components/SpSliders'
import Sprite from '@/components/Sprite'
import TypeBadge from '@/components/TypeBadge'
import Icon from '@/components/Icon'
import TeamCoach from '@/components/TeamCoach'
import type { ResolvedMon } from '@/lib/coach'

const selectClass =
  'h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs font-bold outline-none focus:border-volt-500 dark:border-white/10 dark:bg-card-dark dark:focus:border-volt-400'

function MonEditor({
  mon,
  species,
  moves,
  learnsets,
  onChange,
  onRemove,
}: {
  mon: TeamMon
  species: Species
  moves: Record<string, MoveData>
  learnsets: Record<string, string[]>
  onChange: (mon: TeamMon) => void
  onRemove: () => void
}) {
  const { t, i18n } = useTranslation()
  const abilities = useMemo(() => listAbilities(species.name), [species])
  const moveOptions = useMemo(() => {
    const ids = learnsets[species.id] ?? []
    return ids
      .map((id) => ({ id, move: moves[id] }))
      .filter((x) => x.move)
      .sort((a, b) => a.move.type.localeCompare(b.move.type) || b.move.basePower - a.move.basePower)
  }, [species, moves, learnsets])
  const [moveQuery, setMoveQuery] = useState('')
  const filteredMoves = moveOptions
    .filter(({ move }) => {
      const q = moveQuery.trim().toLowerCase()
      return !q || move.ko.includes(q) || move.name.toLowerCase().includes(q)
    })
    .slice(0, 30)

  const toggleMove = (id: string) =>
    onChange({
      ...mon,
      moves: mon.moves.includes(id)
        ? mon.moves.filter((m) => m !== id)
        : mon.moves.length >= 4
          ? mon.moves
          : [...mon.moves, id],
    })

  return (
    <div className="space-y-3 border-t border-zinc-200/70 pt-3 dark:border-white/8">
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600">{t('calc.ability')}</span>
          <select value={mon.ability} onChange={(e) => onChange({ ...mon, ability: e.target.value })} className={selectClass}>
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
          <select value={mon.item} onChange={(e) => onChange({ ...mon, item: e.target.value })} className={selectClass}>
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
              {n}
            </option>
          ))}
        </select>
      </label>
      <SpSliders sp={mon.sp} onChange={(sp) => onChange({ ...mon, sp })} />

      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600">
            {t('teams.moves')} {mon.moves.length}/4
          </span>
        </div>
        <input
          type="search"
          value={moveQuery}
          onChange={(e) => setMoveQuery(e.target.value)}
          placeholder={t('teams.searchMove')}
          className="mt-1.5 h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs outline-none focus:border-volt-500 dark:border-white/10 dark:bg-black/40 dark:focus:border-volt-400"
        />
        <div className="mt-2 flex max-h-40 flex-wrap gap-1 overflow-y-auto">
          {filteredMoves.map(({ id, move }) => {
            const active = mon.moves.includes(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleMove(id)}
                className={[
                  'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold transition-colors',
                  active
                    ? 'border-volt-500 bg-volt-400/15 text-volt-700 dark:border-volt-400/60 dark:text-volt-300'
                    : 'border-zinc-200 text-zinc-600 dark:border-white/10 dark:text-zinc-300',
                ].join(' ')}
              >
                <TypeBadge type={move.type} size="sm" />
                {i18n.language === 'ko' ? move.ko : move.name}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="text-xs font-bold text-red-500 hover:text-red-600"
      >
        {t('teams.removeMon')}
      </button>
    </div>
  )
}

export default function Teams() {
  const { t, i18n } = useTranslation()
  const { teams, activeId, createTeam, deleteTeam, renameTeam, setActive, setMon, importTeam: importToStore } =
    useTeams()
  const [pokedex, setPokedex] = useState<Species[] | null>(null)
  const [moves, setMoves] = useState<Record<string, MoveData> | null>(null)
  const [learnsets, setLearnsets] = useState<Record<string, string[]> | null>(null)
  const [openSlot, setOpenSlot] = useState<number | null>(null)
  const [ioText, setIoText] = useState('')
  const [ioMode, setIoMode] = useState<'none' | 'import' | 'export'>('none')
  const [shareMsg, setShareMsg] = useState('')

  useEffect(() => {
    loadPokedex().then(setPokedex, () => setPokedex([]))
    loadMoves().then(setMoves)
    loadLearnsets().then(setLearnsets)
  }, [])

  const speciesById = useMemo(() => new Map((pokedex ?? []).map((s) => [s.id, s])), [pokedex])
  const metaRoster = useMemo(() => (pokedex ?? []).filter((s) => s.champions && !s.forme), [pokedex])
  const active = teams.find((tm) => tm.id === activeId) ?? null

  const resolvedTeam = useMemo<ResolvedMon[]>(() => {
    if (!active) return []
    return active.mons
      .map((mon) => {
        if (!mon) return null
        const species = speciesById.get(mon.speciesId)
        return species ? { mon, species } : null
      })
      .filter((x): x is ResolvedMon => x !== null)
  }, [active, speciesById])

  // Create a first team automatically for new users
  useEffect(() => {
    if (pokedex && teams.length === 0) createTeam()
  }, [pokedex, teams.length, createTeam])

  const speedRows = useMemo(() => {
    if (!active) return []
    return active.mons
      .map((mon, slot) => {
        if (!mon) return null
        const species = speciesById.get(mon.speciesId)
        if (!species) return null
        const speed = statAtLevel50(species.baseStats.spe, 'spe', mon.sp.spe, mon.nature)
        return { slot, species, mon, speed }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.speed - a.speed)
  }, [active, speciesById])

  const doExport = () => {
    if (!active || !moves) return
    setIoText(exportTeam(active.mons, { speciesById, moves }))
    setIoMode('export')
  }
  const doImport = () => {
    if (!active || !moves || !pokedex) return
    const speciesByName = new Map<string, Species>()
    for (const s of pokedex) {
      const n = (x: string) => x.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')
      speciesByName.set(n(s.name), s)
      speciesByName.set(n(s.ko), s)
    }
    const moveByName = new Map<string, string>()
    for (const [id, m] of Object.entries(moves)) {
      const n = (x: string) => x.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')
      moveByName.set(n(m.name), id)
      moveByName.set(n(m.ko), id)
    }
    const imported = importTeam(ioText, { speciesByName, moveByName })
    if (imported.length > 0) {
      importToStore({
        id: crypto.randomUUID(),
        name: t('teams.importedName'),
        mons: [0, 1, 2, 3, 4, 5].map((i) => imported[i] ?? null),
        updatedAt: Date.now(),
      })
      setIoMode('none')
      setIoText('')
    }
  }

  if (!active) return <div className="card h-64 animate-pulse" />

  return (
    <div className="space-y-5">
      {/* Team bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto">
          {teams.map((tm) => (
            <button
              key={tm.id}
              type="button"
              onClick={() => setActive(tm.id)}
              className={[
                'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors',
                tm.id === activeId
                  ? 'bg-zinc-900 text-white dark:bg-volt-400 dark:text-black'
                  : 'bg-zinc-100 text-zinc-500 dark:bg-white/6 dark:text-zinc-400',
              ].join(' ')}
            >
              {tm.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => createTeam()}
          className="inline-flex h-9 items-center gap-1 rounded-full border border-zinc-300 px-3 text-sm font-bold text-zinc-600 hover:border-volt-500 dark:border-white/15 dark:text-zinc-300"
        >
          + {t('teams.newTeam')}
        </button>
      </div>

      {/* Team header */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={active.name}
          onChange={(e) => renameTeam(active.id, e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 text-lg font-extrabold outline-none focus:border-zinc-200 dark:focus:border-white/10"
        />
        <button type="button" onClick={() => { setIoText(''); setIoMode('import') }} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:border-volt-500 dark:border-white/10 dark:text-zinc-300">
          {t('teams.import')}
        </button>
        <button type="button" onClick={doExport} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:border-volt-500 dark:border-white/10 dark:text-zinc-300">
          {t('teams.export')}
        </button>
        <button
          type="button"
          onClick={async () => {
            const url = shareUrl(active)
            try {
              await navigator.clipboard.writeText(url)
              setShareMsg(t('teams.shareCopied'))
            } catch {
              setShareMsg(url)
            }
            setTimeout(() => setShareMsg(''), 4000)
          }}
          className="rounded-lg border border-volt-500 px-3 py-1.5 text-xs font-bold text-volt-700 hover:bg-volt-400/10 dark:border-volt-400/60 dark:text-volt-300"
        >
          {t('teams.share')}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(t('teams.confirmDelete'))) deleteTeam(active.id)
          }}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-red-500 hover:border-red-400 dark:border-white/10"
        >
          {t('teams.delete')}
        </button>
      </div>

      {shareMsg && (
        <div className="rounded-lg bg-volt-400/15 px-4 py-2 text-xs font-bold break-all text-volt-700 dark:text-volt-300">
          {shareMsg}
        </div>
      )}

      {/* IO panel */}
      {ioMode !== 'none' && (
        <div className="card space-y-2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              {ioMode === 'export' ? t('teams.exportHint') : t('teams.importHint')}
            </span>
            <button type="button" onClick={() => setIoMode('none')} className="text-xs font-bold text-zinc-400">
              ✕
            </button>
          </div>
          <textarea
            value={ioText}
            onChange={(e) => setIoText(e.target.value)}
            readOnly={ioMode === 'export'}
            rows={8}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs outline-none focus:border-volt-500 dark:border-white/10 dark:bg-black/40"
          />
          {ioMode === 'import' && (
            <button type="button" onClick={doImport} className="rounded-lg bg-volt-400 px-4 py-2 text-sm font-bold text-black">
              {t('teams.doImport')}
            </button>
          )}
        </div>
      )}

      {/* Slots */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {active.mons.map((mon, slot) => {
          const species = mon ? speciesById.get(mon.speciesId) : null
          const isOpen = openSlot === slot
          return (
            <div key={slot} className="card p-4">
              {species && mon ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOpenSlot(isOpen ? null : slot)}
                    className="flex w-full items-center gap-2 text-left"
                  >
                    <Sprite species={species} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{i18n.language === 'ko' ? species.ko : species.name}</p>
                      <div className="flex gap-1">
                        {species.types.map((tp) => (
                          <TypeBadge key={tp} type={tp} size="sm" />
                        ))}
                        <span className="ml-1 text-[10px] font-bold text-zinc-400">SP {spTotal(mon.sp)}/66</span>
                      </div>
                    </div>
                    <Icon name="chevronRight" size={16} className={isOpen ? 'rotate-90' : ''} />
                  </button>
                  {isOpen && moves && learnsets && (
                    <MonEditor
                      mon={mon}
                      species={species}
                      moves={moves}
                      learnsets={learnsets}
                      onChange={(m) => setMon(active.id, slot, m)}
                      onRemove={() => {
                        setMon(active.id, slot, null)
                        setOpenSlot(null)
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600">
                    {t('teams.slot')} {slot + 1}
                  </span>
                  <SpeciesPicker
                    value={null}
                    championsFirst
                    placeholder={t('teams.addMon')}
                    onChange={(s) => {
                      setMon(active.id, slot, { ...emptyMon(s.id), ability: listAbilities(s.name)[0] ?? '' })
                      setOpenSlot(slot)
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Speed tiers */}
      {speedRows.length > 0 && (
        <section className="card p-5">
          <h2 className="text-[15px] font-bold">{t('teams.speedTiers')}</h2>
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-600">{t('teams.speedNote')}</p>
          <div className="mt-4 space-y-2">
            {speedRows.map(({ slot, species, speed }) => {
              const maxSpeed = speedRows[0].speed
              return (
                <div key={slot} className="flex items-center gap-3">
                  <Sprite species={species} size={28} />
                  <span className="w-24 shrink-0 truncate text-sm font-bold">
                    {i18n.language === 'ko' ? species.ko : species.name}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/6">
                    <div
                      className="h-full rounded-full bg-volt-500"
                      style={{ width: `${(speed / maxSpeed) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-sm font-extrabold tabular-nums">{speed}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Auto-diagnosis & coaching (killer feature) */}
      {resolvedTeam.length > 0 && moves && (
        <TeamCoach team={resolvedTeam} moves={moves} metaRoster={metaRoster} />
      )}

      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('teams.disclaimer')}</p>
    </div>
  )
}
