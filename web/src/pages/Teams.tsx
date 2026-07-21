import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadLearnsets, loadMoves, loadPokedex, type MoveData, type Species } from '@/lib/dex'
import { statAtLevel50, spTotal, NATURES, natureLabel, type Nature } from '@/lib/champions'
import { exportTeam, importTeam } from '@/lib/showdown'
import { shareUrl, encodeTeam } from '@/lib/share'
import { createSample } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { loadRegulation } from '@/lib/regulation'
import { loadUsage, resolveUsageMon, type UsageData } from '@/lib/stats'
import { recommendedMoveIds } from '@/lib/moveFilter'
import { TYPES, TYPE_KO, type TypeName } from '@/lib/typechart'
import { isMonComplete, teamIssues } from '@/lib/sampleValidation'
import { useTeams, emptyMon, type TeamMon } from '@/store/teams'
import SpeciesPicker from '@/components/SpeciesPicker'
import ItemSelect from '@/components/ItemSelect'
import ShareImageButton from '@/components/ShareImageButton'
import MobileActionBar, { MobileActionBarSpacer } from '@/components/MobileActionBar'
import SpSliders from '@/components/SpSliders'
import Sprite from '@/components/Sprite'
import TypeBadge from '@/components/TypeBadge'
import Icon from '@/components/Icon'
import TeamCoach from '@/components/TeamCoach'
import MemberRecs from '@/components/MemberRecs'
import type { ResolvedMon } from '@/lib/coach'

const selectClass =
  'h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs font-bold outline-none focus:border-volt-500 dark:border-white/10 dark:bg-card-dark dark:focus:border-volt-400'

function MonEditor({
  mon,
  species,
  moves,
  learnsets,
  usageMoveIds,
  onChange,
  onRemove,
  onPublishMon,
  publishing,
}: {
  mon: TeamMon
  species: Species
  moves: Record<string, MoveData>
  learnsets: Record<string, string[]>
  usageMoveIds: Set<string>
  onChange: (mon: TeamMon) => void
  onRemove: () => void
  onPublishMon: (description: string) => void
  publishing?: boolean
}) {
  const { t, i18n } = useTranslation()
  const abilities = species.abilities
  const moveOptions = useMemo(() => {
    const myTypes = new Set(species.types)
    const ids = learnsets[species.id] ?? []
    // Verified Champions movepool, ordered for team-building: damaging moves
    // before status, STAB before off-type, then by power. (The old type-
    // alphabetical order + a 30-move cap hid signature moves — e.g. a Fire
    // Pokemon's Fire moves fell past the cutoff and looked "missing".)
    return ids
      .map((id) => ({ id, move: moves[id] }))
      .filter((x) => x.move)
      .sort((a, b) => {
        const ad = a.move.basePower > 0 ? 1 : 0
        const bd = b.move.basePower > 0 ? 1 : 0
        if (ad !== bd) return bd - ad
        const as = myTypes.has(a.move.type) ? 1 : 0
        const bs = myTypes.has(b.move.type) ? 1 : 0
        if (as !== bs) return bs - as
        if (b.move.basePower !== a.move.basePower) return b.move.basePower - a.move.basePower
        return a.move.name.localeCompare(b.move.name)
      })
  }, [species, moves, learnsets])
  const [moveQuery, setMoveQuery] = useState('')
  const [showAllMoves, setShowAllMoves] = useState(false)
  // Author note for publishing THIS mon as an individual sample (not saved on
  // the team itself — teams carry their own description field).
  const [monDesc, setMonDesc] = useState('')
  // Recommended default: meta usage + STAB + key utility (~18), so the picker
  // isn't buried under every legal-but-niche move. "전체 보기" reveals the full
  // verified movepool, and already-picked moves always stay visible.
  const recommended = useMemo(
    () => recommendedMoveIds(species, moveOptions, usageMoveIds),
    [species, moveOptions, usageMoveIds],
  )
  const q = moveQuery.trim().toLowerCase()
  const filteredMoves = moveOptions.filter(({ id, move }) => {
    if (q) return move.ko.includes(q) || move.name.toLowerCase().includes(q)
    // No query: recommended set (+ anything already selected), unless showing all.
    return showAllMoves || recommended.has(id) || mon.moves.includes(id)
  })
  const hiddenCount = moveOptions.length - (showAllMoves ? moveOptions.length : filteredMoves.length)

  // Currently-picked moves, in selection order — pinned above the pool so the
  // user never scrolls to see what they chose.
  const selectedMoves = mon.moves
    .map((id) => ({ id, move: moves[id] }))
    .filter((x): x is { id: string; move: MoveData } => Boolean(x.move))
  // Selectable pool grouped by type (same 상성 together), selected moves removed
  // since they're shown in the pinned section. Preserves the STAB/power sort
  // from moveOptions within each type group; groups follow the type-chart order.
  const groupedMoves = TYPES.map((type) => ({
    type,
    list: filteredMoves.filter(({ id, move }) => move.type === type && !mon.moves.includes(id)),
  })).filter((g) => g.list.length > 0)

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
              <option key={a.name} value={a.name}>
                {i18n.language === 'ko' ? a.ko : a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600">{t('calc.item')}</span>
          <ItemSelect value={mon.item} onChange={(item) => onChange({ ...mon, item })} className={selectClass} />
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
      <SpSliders sp={mon.sp} onChange={(sp) => onChange({ ...mon, sp })} nature={mon.nature} />

      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600">
            {t('teams.moves')} {mon.moves.length}/4
            <span className="ml-1 font-semibold text-zinc-300 dark:text-zinc-600">
              · {showAllMoves || q ? t('teams.movesAll') : t('teams.movesRecommended')}
            </span>
          </span>
        </div>

        {/* Selected moves — pinned at the top so the current picks are always
            visible at a glance (no scrolling through the pool to review them).
            Tap a chip to remove it. */}
        <div className="mt-1.5 rounded-xl border border-volt-500/40 bg-volt-400/5 p-2 dark:border-volt-400/30">
          <span className="text-[10px] font-bold text-volt-700 dark:text-volt-300">
            {t('teams.selectedMoves')} {mon.moves.length}/4
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {selectedMoves.map(({ id, move }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleMove(id)}
                className="flex items-center gap-1 rounded-full border border-volt-500 bg-volt-400/15 px-2 py-0.5 text-[11px] font-bold text-volt-700 transition-colors dark:border-volt-400/60 dark:text-volt-300"
              >
                <TypeBadge type={move.type} size="sm" />
                {i18n.language === 'ko' ? move.ko : move.name}
                <Icon name="x" size={11} strokeWidth={2.6} className="opacity-70" />
              </button>
            ))}
            {selectedMoves.length === 0 && (
              <span className="px-1 py-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                {t('teams.noMoveSelected')}
              </span>
            )}
          </div>
        </div>

        <input
          type="search"
          value={moveQuery}
          onChange={(e) => setMoveQuery(e.target.value)}
          placeholder={t('teams.searchMove')}
          className="mt-2 h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs outline-none focus:border-volt-500 dark:border-white/10 dark:bg-black/40 dark:focus:border-volt-400"
        />
        {/* Selectable pool, grouped by type (same 상성 together). Already-picked
            moves are omitted here since they live in the pinned section above. */}
        <div className="mt-2 max-h-56 space-y-2.5 overflow-y-auto">
          {groupedMoves.map(({ type, list }) => (
            <div key={type}>
              <div className="mb-1 flex items-center gap-1.5">
                <TypeBadge type={type} size="sm" />
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                  {i18n.language === 'ko' ? TYPE_KO[type as TypeName] ?? type : type}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {list.map(({ id, move }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleMove(id)}
                    disabled={mon.moves.length >= 4}
                    className="flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-bold text-zinc-600 transition-colors hover:border-volt-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-200 dark:border-white/10 dark:text-zinc-300 dark:hover:border-volt-400/60 dark:disabled:hover:border-white/10"
                  >
                    <TypeBadge type={move.type} size="sm" />
                    {i18n.language === 'ko' ? move.ko : move.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {groupedMoves.length === 0 && (
            <span className="px-1 py-1 text-[11px] text-zinc-400">{t('dex.noResults')}</span>
          )}
        </div>
        {!q && (
          <button
            type="button"
            onClick={() => setShowAllMoves((v) => !v)}
            className="mt-1.5 text-[11px] font-bold text-volt-600 hover:underline dark:text-volt-400"
          >
            {showAllMoves
              ? t('teams.showRecommended')
              : t('teams.showAllMoves', { count: hiddenCount })}
          </button>
        )}
      </div>

      {/* Publish this single mon as an individual build sample. The note is
          optional; the button is gated on a complete build (ability · item ·
          4 distinct moves · SP 66). */}
      <div className="space-y-1.5 rounded-xl border border-zinc-200/70 p-2.5 dark:border-white/8">
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600">{t('teams.monSampleNote')}</span>
        <textarea
          value={monDesc}
          onChange={(e) => setMonDesc(e.target.value.slice(0, 500))}
          maxLength={500}
          rows={2}
          placeholder={t('teams.monDescPlaceholder')}
          className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-volt-500 dark:border-white/10 dark:bg-black/40 dark:focus:border-volt-400"
        />
        <button
          type="button"
          disabled={!isMonComplete(mon) || publishing}
          onClick={() => onPublishMon(monDesc)}
          title={isMonComplete(mon) ? '' : t('teams.monIncomplete')}
          className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-volt-500 px-2.5 py-1.5 text-[11px] font-bold text-volt-700 hover:bg-volt-400/10 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400 disabled:hover:bg-transparent dark:border-volt-400/60 dark:text-volt-300 dark:disabled:border-white/10 dark:disabled:text-zinc-600"
        >
          <Icon name="sparkles" size={12} />
          {t('teams.publishMon')}
        </button>
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
  const { teams, activeId, createTeam, deleteTeam, renameTeam, setDescription, setActive, setMon, importTeam: importToStore } =
    useTeams()
  const user = useAuth((s) => s.user)
  const [pokedex, setPokedex] = useState<Species[] | null>(null)
  const [moves, setMoves] = useState<Record<string, MoveData> | null>(null)
  const [learnsets, setLearnsets] = useState<Record<string, string[]> | null>(null)
  const [openSlot, setOpenSlot] = useState<number | null>(null)
  const [ioText, setIoText] = useState('')
  const [ioMode, setIoMode] = useState<'none' | 'import' | 'export'>('none')
  const [shareMsg, setShareMsg] = useState('')
  const [usage, setUsage] = useState<UsageData | null>(null)
  // Build mode: 'team' (6-mon party) or 'mon' (single-Pokemon sample builder).
  const [mode, setMode] = useState<'team' | 'mon'>('team')
  const [monBuild, setMonBuild] = useState<TeamMon | null>(null)
  // Publish state: a centered popup (so the confirmation isn't hidden behind the
  // top bar) + a busy flag that blocks double-click double-uploads.
  const [uploadResult, setUploadResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [publishing, setPublishing] = useState(false)

  // Auto-dismiss a successful upload popup after a few seconds.
  useEffect(() => {
    if (!uploadResult?.ok) return
    const id = setTimeout(() => setUploadResult(null), 3500)
    return () => clearTimeout(id)
  }, [uploadResult])

  useEffect(() => {
    loadPokedex().then(setPokedex, () => setPokedex([]))
    loadMoves().then(setMoves)
    loadLearnsets().then(setLearnsets)
    loadUsage().then(setUsage, () => setUsage(null))
  }, [])

  const speciesById = useMemo(() => new Map((pokedex ?? []).map((s) => [s.id, s])), [pokedex])
  // Per-species meta moves (from usage stats) — feeds the recommended move view.
  const usageMovesBySpecies = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const p of usage?.pokemon ?? []) map.set(p.id, new Set(p.moves.map((m) => m.name)))
    return map
  }, [usage])
  // Meta threats = the TOP usage Pokemon (not the whole roster), so the coach's
  // "threat coverage" and score stay meaningful. Falls back to the highest-BST
  // Champions Pokemon when usage data isn't available.
  const metaRoster = useMemo(() => {
    const dex = pokedex ?? []
    if (usage && usage.pokemon.length > 0) {
      const top: Species[] = []
      for (const u of usage.pokemon.slice(0, 24)) {
        const r = resolveUsageMon(u.id, u.name, speciesById, true)
        if (r.species) top.push(r.species)
      }
      if (top.length > 0) return top
    }
    return [...dex.filter((s) => s.champions && !s.forme)]
      .sort((a, b) => Object.values(b.baseStats).reduce((x, y) => x + y, 0) - Object.values(a.baseStats).reduce((x, y) => x + y, 0))
      .slice(0, 24)
  }, [pokedex, usage, speciesById])
  // Fall back to the first team when activeId is stale (e.g. after deleting the
  // active team, or a persisted id that no longer exists).
  const active = teams.find((tm) => tm.id === activeId) ?? teams[0] ?? null

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

  // Publish the whole team as a sample — gated on every slot being complete
  // (6 mons, each with ability · item · 4 moves · SP).
  const publishTeam = async () => {
    if (!active || publishing) return
    if (teamIssues(active).length > 0) {
      setUploadResult({ ok: false, msg: t('teams.teamIncomplete') })
      return
    }
    setPublishing(true)
    const reg = await loadRegulation()
    const r = await createSample({
      title: active.name,
      author: user?.displayName ?? '',
      team: encodeTeam(active),
      regulation: reg?.regulation ?? null,
      description: active.description ?? null,
      kind: 'team',
    })
    setPublishing(false)
    setUploadResult({ ok: r.configured, msg: r.configured ? t('teams.published') : t('teams.publishUnavailable') })
  }

  // Publish a single finished Pokemon as an individual build sample. On success
  // `onDone` runs (the single-mon builder clears its slot to block re-uploads).
  const publishMon = async (mon: TeamMon, species: Species, description: string, onDone?: () => void) => {
    if (publishing) return
    if (!isMonComplete(mon)) {
      setUploadResult({ ok: false, msg: t('teams.monIncomplete') })
      return
    }
    setPublishing(true)
    const reg = await loadRegulation()
    const name = i18n.language === 'ko' ? species.ko : species.name
    const r = await createSample({
      title: name,
      author: user?.displayName ?? '',
      team: encodeTeam({ name, mons: [mon, null, null, null, null, null] }),
      regulation: reg?.regulation ?? null,
      description: description.trim() || null,
      kind: 'mon',
    })
    setPublishing(false)
    setUploadResult({ ok: r.configured, msg: r.configured ? t('teams.publishedMon') : t('teams.publishUnavailable') })
    if (r.configured) onDone?.()
  }

  // Centered upload popup (shown in every mode below via {uploadModal}).
  const uploadModal = uploadResult ? (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t('report.close')}
        onClick={() => setUploadResult(null)}
      />
      <div className="card relative w-full max-w-xs space-y-3 p-6 text-center">
        <span
          className={`mx-auto grid size-14 place-items-center rounded-full ${
            uploadResult.ok ? 'bg-volt-400/20 text-volt-600 dark:text-volt-400' : 'bg-rose-500/15 text-rose-500'
          }`}
        >
          <Icon name={uploadResult.ok ? 'check' : 'x'} size={28} strokeWidth={2.4} />
        </span>
        <p className="text-base font-extrabold">{uploadResult.ok ? t('teams.uploadDone') : t('teams.uploadFail')}</p>
        <p className="text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{uploadResult.msg}</p>
        <div className="flex gap-2 pt-1">
          {uploadResult.ok && (
            <Link
              to="/gallery"
              onClick={() => setUploadResult(null)}
              className="flex-1 rounded-xl bg-volt-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-volt-300"
            >
              {t('teams.viewInGallery')}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setUploadResult(null)}
            className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-600 hover:border-zinc-300 dark:border-white/10 dark:text-zinc-300"
          >
            {t('report.close')}
          </button>
        </div>
      </div>
    </div>
  ) : null

  // Team / single-Pokemon build-mode tabs (shown in every state below).
  const modeTabs = (
    <div className="flex gap-1.5 rounded-full border border-zinc-200 p-1 dark:border-white/10">
      {(['team', 'mon'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={[
            'flex-1 rounded-full px-4 py-1.5 text-sm font-bold transition-colors',
            mode === m
              ? 'bg-zinc-900 text-white dark:bg-volt-400 dark:text-black'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white',
          ].join(' ')}
        >
          {t(m === 'team' ? 'teams.modeTeam' : 'teams.modeMon')}
        </button>
      ))}
    </div>
  )

  const shareBanner = shareMsg ? (
    <p className="rounded-xl border border-volt-500/40 bg-volt-400/10 px-4 py-2.5 text-center text-sm font-bold text-volt-700 dark:text-volt-300">
      {shareMsg}
    </p>
  ) : null

  // ── Single-Pokemon sample builder ─────────────────────────────────────────
  if (mode === 'mon') {
    const monSpecies = monBuild ? speciesById.get(monBuild.speciesId) : null
    return (
      <div className="space-y-5">
        {uploadModal}
        {modeTabs}
        {shareBanner}
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('teams.monModeHint')}</p>
        <div className="card space-y-3 p-4">
          {monSpecies && monBuild ? (
            <>
              <div className="flex items-center gap-2.5">
                <Sprite species={monSpecies} size={44} />
                <p className="min-w-0 flex-1 truncate text-base font-extrabold">
                  {i18n.language === 'ko' ? monSpecies.ko : monSpecies.name}
                </p>
                <button
                  type="button"
                  onClick={() => setMonBuild(null)}
                  className="shrink-0 rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-bold text-zinc-500 hover:border-volt-500 dark:border-white/10 dark:text-zinc-400"
                >
                  {t('teams.changeMon')}
                </button>
              </div>
              {moves && learnsets && (
                <MonEditor
                  mon={monBuild}
                  species={monSpecies}
                  moves={moves}
                  learnsets={learnsets}
                  usageMoveIds={usageMovesBySpecies.get(monSpecies.id) ?? new Set()}
                  onChange={setMonBuild}
                  onRemove={() => setMonBuild(null)}
                  onPublishMon={(desc) => publishMon(monBuild, monSpecies, desc, () => setMonBuild(null))}
                  publishing={publishing}
                />
              )}
            </>
          ) : pokedex ? (
            <SpeciesPicker
              value={null}
              championsFirst
              typeFilter
              placeholder={t('teams.addMon')}
              onChange={(s) => setMonBuild({ ...emptyMon(s.id), ability: s.abilities[0]?.name ?? '' })}
            />
          ) : (
            <div className="h-40 animate-pulse rounded-xl bg-zinc-100 dark:bg-white/5" />
          )}
        </div>
      </div>
    )
  }

  if (!active) {
    // Dex still loading → skeleton. Otherwise the user has no teams (e.g. deleted
    // them all): show an empty state with a create button instead of silently
    // auto-recreating a team (which looked like a deleted team "coming back").
    if (pokedex === null) return <div className="card h-64 animate-pulse" />
    return (
      <div className="space-y-5">
        {uploadModal}
        {modeTabs}
        <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-volt-400/15 text-volt-600 dark:text-volt-400">
          <Icon name="users" size={26} />
        </span>
        <div className="space-y-1">
          <p className="text-lg font-extrabold tracking-tight">{t('teams.emptyTitle')}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('teams.emptyBody')}</p>
        </div>
        <button
          type="button"
          onClick={() => createTeam()}
          className="inline-flex items-center gap-1.5 rounded-full bg-volt-400 px-5 py-2.5 text-sm font-bold text-black transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          + {t('teams.newTeam')}
        </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {uploadModal}
      {modeTabs}
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

      {/* Team header: name stays inline; primary actions drop to a thumb-reach
          bottom bar on mobile, stay inline on desktop (MobileActionBar). */}
      <div className="space-y-1.5">
        <input
          value={active.name}
          onChange={(e) => renameTeam(active.id, e.target.value)}
          maxLength={40}
          placeholder={t('teams.namePlaceholder')}
          className="w-full rounded-lg border border-transparent bg-transparent px-1 text-lg font-extrabold outline-none focus:border-zinc-200 dark:focus:border-white/10"
        />
        <textarea
          value={active.description ?? ''}
          onChange={(e) => setDescription(active.id, e.target.value.slice(0, 500))}
          maxLength={500}
          rows={2}
          placeholder={t('teams.descPlaceholder')}
          className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[13px] leading-relaxed outline-none focus:border-volt-500 dark:border-white/10 dark:bg-white/5"
        />
      </div>

      <MobileActionBar>
        <span className="shrink-0">
          <ShareImageButton title={active.name} mons={active.mons} speciesById={speciesById} moves={moves} />
        </span>
        <button type="button" onClick={() => { setIoText(''); setIoMode('import') }} className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:border-volt-500 dark:border-white/10 dark:text-zinc-300">
          {t('teams.import')}
        </button>
        <button type="button" onClick={doExport} className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:border-volt-500 dark:border-white/10 dark:text-zinc-300">
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
          className="shrink-0 rounded-lg border border-volt-500 px-3 py-1.5 text-xs font-bold text-volt-700 hover:bg-volt-400/10 dark:border-volt-400/60 dark:text-volt-300"
        >
          {t('teams.share')}
        </button>
        <button
          type="button"
          onClick={publishTeam}
          disabled={publishing}
          className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:border-volt-500 disabled:opacity-50 dark:border-white/10 dark:text-zinc-300"
        >
          {t('teams.publish')}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(t('teams.confirmDelete'))) deleteTeam(active.id)
          }}
          className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-red-500 hover:border-red-400 dark:border-white/10"
        >
          {t('teams.delete')}
        </button>
      </MobileActionBar>

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

      {/* Slots — items-start so an expanded card doesn't stretch its row-mates
          to the same (tall) height, leaving empty gaps in collapsed slots. */}
      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      usageMoveIds={usageMovesBySpecies.get(species.id) ?? new Set()}
                      onChange={(m) => setMon(active.id, slot, m)}
                      onRemove={() => {
                        setMon(active.id, slot, null)
                        setOpenSlot(null)
                      }}
                      onPublishMon={(desc) => publishMon(mon, species, desc)}
                      publishing={publishing}
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
                    typeFilter
                    placeholder={t('teams.addMon')}
                    onChange={(s) => {
                      setMon(active.id, slot, { ...emptyMon(s.id), ability: s.abilities[0]?.name ?? '' })
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

      {/* Team-completion recommender — which Pokemon to add to patch holes. */}
      {active && pokedex && moves && resolvedTeam.length > 0 && (
        <MemberRecs
          team={resolvedTeam}
          moves={moves}
          metaRoster={metaRoster}
          pokedex={pokedex}
          usage={usage}
          speciesById={speciesById}
          canAdd={active.mons.some((m) => m === null)}
          onAdd={(s) => {
            const slot = active.mons.findIndex((m) => m === null)
            if (slot === -1) return
            setMon(active.id, slot, { ...emptyMon(s.id), ability: s.abilities[0]?.name ?? '' })
            setOpenSlot(slot)
          }}
        />
      )}

      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('teams.disclaimer')}</p>
      <MobileActionBarSpacer />
    </div>
  )
}
