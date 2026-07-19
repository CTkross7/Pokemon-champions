import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  listSamples,
  likeSample,
  getSample,
  deleteSample,
  listComments,
  addComment,
  deleteComment,
  type SampleMeta,
  type Comment,
} from '@/lib/api'
import { decodeTeam } from '@/lib/share'
import { sampleSpecies } from '@/lib/sampleSprites'
import { loadPokedexAll, loadMoves, type Species, type MoveData } from '@/lib/dex'
import { loadItems, type ItemEntry } from '@/lib/items'
import { spTotal, STAT_KEYS } from '@/lib/champions'
import { useTeams, type TeamMon } from '@/store/teams'
import { useAuth } from '@/lib/auth'
import ReportButton from '@/components/ReportButton'
import Sprite from '@/components/Sprite'
import TypeBadge from '@/components/TypeBadge'
import Icon from '@/components/Icon'

export default function Gallery() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { importTeam } = useTeams()
  const user = useAuth((s) => s.user)
  const [state, setState] = useState<'loading' | 'ready' | 'unconfigured'>('loading')
  const [samples, setSamples] = useState<SampleMeta[]>([])
  const [regulations, setRegulations] = useState<string[]>([])
  const [regFilter, setRegFilter] = useState<string | null>(null)
  const [kindFilter, setKindFilter] = useState<'all' | 'team' | 'mon'>('all')
  const [sort, setSort] = useState<'recent' | 'popular'>('recent')
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [openId, setOpenId] = useState<string | null>(null)
  const [buildId, setBuildId] = useState<string | null>(null)
  const [byId, setById] = useState<Map<string, Species>>(new Map())
  const [moves, setMoves] = useState<Record<string, MoveData>>({})
  const [itemByName, setItemByName] = useState<Map<string, ItemEntry>>(new Map())

  useEffect(() => {
    loadPokedexAll().then((all) => setById(new Map(all.map((s) => [s.id, s]))), () => {})
    loadMoves().then(setMoves, () => {})
    loadItems().then((list) => setItemByName(new Map(list.map((i) => [i.name, i]))), () => {})
  }, [])

  const load = (
    reg: string | null = regFilter,
    kind: 'all' | 'team' | 'mon' = kindFilter,
    srt: 'recent' | 'popular' = sort,
  ) => {
    setState('loading')
    listSamples(reg ?? undefined, kind === 'all' ? undefined : kind, srt).then((r) => {
      if (!r.configured) return setState('unconfigured')
      setSamples(r.data.samples)
      // Keep the union of regulations stable across filtered views.
      if (!reg && kind === 'all') setRegulations(r.data.regulations ?? [])
      setState('ready')
    })
  }

  useEffect(() => {
    load(null, 'all', 'recent')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onLike = async (id: string) => {
    if (!user) return navigate('/login')
    if (liked[id]) return
    const r = await likeSample(id)
    if (r.configured) {
      setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, likes: r.data.likes } : s)))
      setLiked((prev) => ({ ...prev, [id]: true }))
    }
  }

  const onImport = async (id: string, title: string) => {
    if (!user) return navigate('/login')
    const r = await getSample(id)
    if (!r.configured) return
    const decoded = decodeTeam(r.data.sample.team)
    if (!decoded) return
    importTeam({ id: crypto.randomUUID(), name: title, mons: decoded.mons, updatedAt: Date.now() })
    navigate('/teams')
  }

  const onDelete = async (id: string) => {
    if (!confirm(t('gallery.deleteConfirm'))) return
    const r = await deleteSample(id)
    if (r.configured) setSamples((prev) => prev.filter((s) => s.id !== id))
  }

  const canDelete = (s: SampleMeta) => Boolean(user && (user.isAdmin || s.owner_id === user.id))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">{t('gallery.title')}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('gallery.subtitle')}</p>
      </div>

      {/* Kind (팀/포켓몬) + sort (최신/인기) */}
      {state !== 'unconfigured' && (
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip active={kindFilter === 'all'} onClick={() => { setKindFilter('all'); load(regFilter, 'all', sort) }}>
            {t('gallery.kindAll')}
          </FilterChip>
          <FilterChip active={kindFilter === 'mon'} onClick={() => { setKindFilter('mon'); load(regFilter, 'mon', sort) }}>
            {t('gallery.kindMon')}
          </FilterChip>
          <FilterChip active={kindFilter === 'team'} onClick={() => { setKindFilter('team'); load(regFilter, 'team', sort) }}>
            {t('gallery.kindTeam')}
          </FilterChip>
          <span className="mx-1 h-4 w-px bg-zinc-200 dark:bg-white/10" />
          <FilterChip active={sort === 'recent'} onClick={() => { setSort('recent'); load(regFilter, kindFilter, 'recent') }}>
            {t('gallery.sortRecent')}
          </FilterChip>
          <FilterChip active={sort === 'popular'} onClick={() => { setSort('popular'); load(regFilter, kindFilter, 'popular') }}>
            {t('gallery.sortPopular')}
          </FilterChip>
        </div>
      )}

      {/* Regulation filter */}
      {state === 'ready' && regulations.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip active={regFilter === null} onClick={() => { setRegFilter(null); load(null, kindFilter, sort) }}>
            {t('gallery.filterAll')}
          </FilterChip>
          {regulations.map((reg) => (
            <FilterChip key={reg} active={regFilter === reg} onClick={() => { setRegFilter(reg); load(reg, kindFilter, sort) }}>
              {reg}
            </FilterChip>
          ))}
        </div>
      )}

      {state === 'loading' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
      )}

      {state === 'unconfigured' && (
        <div className="card space-y-3 p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-white/5">
            <Icon name="users" size={26} />
          </span>
          <h2 className="text-lg font-bold">{t('gallery.notReady')}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('gallery.notReadyNote')}</p>
          <Link to="/teams" className="inline-block text-sm font-bold text-volt-600 dark:text-volt-400">
            {t('gallery.shareVia')} →
          </Link>
        </div>
      )}

      {state === 'ready' && samples.length === 0 && (
        <div className="card p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">{t('gallery.empty')}</div>
      )}

      {state === 'ready' && samples.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {samples.map((s) => {
            const species = sampleSpecies(s.team, byId)
            return (
            <div key={s.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-extrabold ${
                        s.kind === 'mon'
                          ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                          : 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
                      }`}
                    >
                      {s.kind === 'mon' ? t('gallery.kindMon') : t('gallery.kindTeam')}
                    </span>
                    <p className="truncate text-sm font-bold">{s.title}</p>
                    {s.regulation && (
                      <span className="shrink-0 rounded bg-volt-400/20 px-1.5 py-0.5 text-[9px] font-extrabold text-volt-700 dark:text-volt-300">
                        {s.regulation}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-600">
                    {s.author} · {t('gallery.views', { count: s.views })}
                  </p>
                  {s.description && (
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {s.description}
                    </p>
                  )}
                  {species.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {species.slice(0, 6).map((sp, i) => (
                        <Sprite key={i} species={sp} size={s.kind === 'mon' ? 40 : 30} />
                      ))}
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    <ReportButton targetType="sample" targetId={s.id} />
                    {canDelete(s) && (
                      <button type="button" onClick={() => onDelete(s.id)} className="text-[11px] font-bold text-red-500">
                        {t('gallery.delete')}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onLike(s.id)}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${liked[s.id] ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-zinc-100 text-zinc-500 dark:bg-white/6 dark:text-zinc-400'}`}
                  >
                    <Icon name="heart" size={13} />
                    {s.likes}
                  </button>
                  <button
                    type="button"
                    onClick={() => onImport(s.id, s.title)}
                    className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white dark:bg-volt-400 dark:text-black"
                  >
                    {t('gallery.import')}
                  </button>
                </div>
              </div>

              {/* Build detail + comments toggles */}
              <div className="mt-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setBuildId(buildId === s.id ? null : s.id)}
                  className="flex items-center gap-1 text-[12px] font-bold text-zinc-500 hover:text-volt-600 dark:text-zinc-400 dark:hover:text-volt-400"
                >
                  <Icon name="grid" size={13} />
                  {t('gallery.buildDetail')}
                  <Icon name="chevronRight" size={12} className={buildId === s.id ? 'rotate-90 transition-transform' : 'transition-transform'} />
                </button>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === s.id ? null : s.id)}
                  className="flex items-center gap-1 text-[12px] font-bold text-zinc-500 hover:text-volt-600 dark:text-zinc-400 dark:hover:text-volt-400"
                >
                  <Icon name="chat" size={14} />
                  {t('gallery.comments', { count: s.comments ?? 0 })}
                  <Icon name="chevronRight" size={12} className={openId === s.id ? 'rotate-90 transition-transform' : 'transition-transform'} />
                </button>
              </div>
              {buildId === s.id && (
                <SampleBuildDetail team={s.team} byId={byId} moves={moves} itemByName={itemByName} ko={i18n.language === 'ko'} />
              )}
              {openId === s.id && (
                <CommentSection
                  sampleId={s.id}
                  locale={i18n.language}
                  onCountChange={(n) => setSamples((prev) => prev.map((x) => (x.id === s.id ? { ...x, comments: n } : x)))}
                />
              )}
            </div>
            )
          })}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('gallery.note')}</p>
    </div>
  )
}

const STAT_LABEL: Record<string, { ko: string; en: string }> = {
  hp: { ko: 'HP', en: 'HP' },
  atk: { ko: '공격', en: 'Atk' },
  def: { ko: '방어', en: 'Def' },
  spa: { ko: '특공', en: 'SpA' },
  spd: { ko: '특방', en: 'SpD' },
  spe: { ko: '스피드', en: 'Spe' },
}

/** Expanded build detail: each Pokemon's ability · item · 4 moves · SP spread. */
function SampleBuildDetail({
  team,
  byId,
  moves,
  itemByName,
  ko,
}: {
  team?: string
  byId: Map<string, Species>
  moves: Record<string, MoveData>
  itemByName: Map<string, ItemEntry>
  ko: boolean
}) {
  const decoded = team ? decodeTeam(team) : null
  const mons = (decoded?.mons ?? []).filter((m): m is TeamMon => !!m)
  if (mons.length === 0) return null
  return (
    <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 dark:border-white/6">
      {mons.map((m, i) => {
        const sp = byId.get(m.speciesId)
        if (!sp) return null
        const ability = sp.abilities.find((a) => a.name === m.ability)
        const item = itemByName.get(m.item)
        return (
          <div key={i} className="rounded-xl border border-zinc-100 p-2.5 dark:border-white/6">
            <div className="flex items-center gap-2">
              <Sprite species={sp} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold">{ko ? sp.ko : sp.name}</p>
                <p className="truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                  {ability ? (ko ? ability.ko : ability.name) : m.ability || '-'}
                  {m.item && ` · ${item ? (ko ? item.ko : item.name) : m.item}`}
                </p>
              </div>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {m.moves.filter(Boolean).map((id) => {
                const mv = moves[id]
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:border-white/10 dark:text-zinc-300"
                  >
                    {mv && <TypeBadge type={mv.type} size="sm" />}
                    {mv ? (ko ? mv.ko : mv.name) : id}
                  </span>
                )
              })}
            </div>
            {spTotal(m.sp) > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                {STAT_KEYS.filter((k) => m.sp[k] > 0).map((k) => (
                  <span key={k}>
                    <span className="font-bold text-zinc-600 dark:text-zinc-300">{ko ? STAT_LABEL[k].ko : STAT_LABEL[k].en}</span>{' '}
                    {m.sp[k]}
                  </span>
                ))}
                <span className="text-zinc-400 dark:text-zinc-600">· SP {spTotal(m.sp)}/66</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
        active ? 'bg-zinc-900 text-white dark:bg-volt-400 dark:text-black' : 'bg-zinc-100 text-zinc-500 dark:bg-white/6 dark:text-zinc-400',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function CommentSection({
  sampleId,
  locale,
  onCountChange,
}: {
  sampleId: string
  locale: string
  onCountChange: (n: number) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    listComments(sampleId).then((r) => setComments(r.configured ? r.data.comments : []))
  }, [sampleId])

  const submit = async () => {
    const body = text.trim()
    if (!body) return
    if (!user) return navigate('/login')
    setBusy(true)
    const r = await addComment(sampleId, body)
    setBusy(false)
    if (r.configured) {
      const next = await listComments(sampleId)
      if (next.configured) {
        setComments(next.data.comments)
        onCountChange(next.data.comments.length)
      }
      setText('')
    }
  }

  const remove = async (cid: string) => {
    const r = await deleteComment(sampleId, cid)
    if (r.configured) {
      const next = comments?.filter((c) => c.id !== cid) ?? []
      setComments(next)
      onCountChange(next.length)
    }
  }

  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 dark:border-white/6">
      {comments === null && <p className="text-[12px] text-zinc-400">…</p>}
      {comments?.length === 0 && <p className="text-[12px] text-zinc-400 dark:text-zinc-600">{t('gallery.noComments')}</p>}
      {comments?.map((c) => (
        <div key={c.id} className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[12px]">
              <span className="font-bold">{c.author}</span>{' '}
              <span className="text-zinc-400 dark:text-zinc-600">· {fmt(c.created_at)}</span>
            </p>
            <p className="text-[13px] leading-snug text-zinc-700 break-words dark:text-zinc-200">{c.body}</p>
          </div>
          {user && (user.isAdmin || user.id === c.user_id) && (
            <button type="button" onClick={() => remove(c.id)} className="shrink-0 text-[11px] font-bold text-red-500">
              {t('gallery.delete')}
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          maxLength={500}
          placeholder={user ? t('gallery.commentPlaceholder') : t('gallery.loginToComment')}
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-volt-500 dark:border-white/10 dark:bg-white/5"
        />
        <button
          type="button"
          disabled={busy || !text.trim()}
          onClick={submit}
          className="shrink-0 rounded-lg bg-volt-400 px-3 py-2 text-[13px] font-bold text-black disabled:opacity-40"
        >
          {t('gallery.send')}
        </button>
      </div>
    </div>
  )
}
