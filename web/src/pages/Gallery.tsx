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
import { useTeams } from '@/store/teams'
import { useAuth } from '@/lib/auth'
import ReportButton from '@/components/ReportButton'
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
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [openId, setOpenId] = useState<string | null>(null)

  const load = (reg?: string | null) => {
    setState('loading')
    listSamples(reg ?? undefined).then((r) => {
      if (!r.configured) return setState('unconfigured')
      setSamples(r.data.samples)
      // Keep the union of regulations stable across filtered views.
      if (!reg) setRegulations(r.data.regulations ?? [])
      setState('ready')
    })
  }

  useEffect(() => {
    load(null)
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

      {/* Regulation filter */}
      {state === 'ready' && regulations.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip active={regFilter === null} onClick={() => { setRegFilter(null); load(null) }}>
            {t('gallery.filterAll')}
          </FilterChip>
          {regulations.map((reg) => (
            <FilterChip key={reg} active={regFilter === reg} onClick={() => { setRegFilter(reg); load(reg) }}>
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
          {samples.map((s) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
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
                  <div className="mt-1 flex items-center gap-2">
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
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${liked[s.id] ? 'bg-volt-400/20 text-volt-700 dark:text-volt-300' : 'bg-zinc-100 text-zinc-500 dark:bg-white/6 dark:text-zinc-400'}`}
                  >
                    ♥ {s.likes}
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

              {/* Comments toggle */}
              <button
                type="button"
                onClick={() => setOpenId(openId === s.id ? null : s.id)}
                className="mt-3 flex items-center gap-1 text-[12px] font-bold text-zinc-500 hover:text-volt-600 dark:text-zinc-400 dark:hover:text-volt-400"
              >
                <Icon name="chat" size={14} />
                {t('gallery.comments', { count: s.comments ?? 0 })}
                <Icon name="chevronRight" size={12} className={openId === s.id ? 'rotate-90 transition-transform' : 'transition-transform'} />
              </button>
              {openId === s.id && (
                <CommentSection
                  sampleId={s.id}
                  locale={i18n.language}
                  onCountChange={(n) => setSamples((prev) => prev.map((x) => (x.id === s.id ? { ...x, comments: n } : x)))}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('gallery.note')}</p>
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
