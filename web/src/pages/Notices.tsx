import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/auth'
import {
  listNotices,
  createNotice,
  deleteNotice,
  type Notice,
  type NoticeCategory,
} from '@/lib/notices'
import Icon from '@/components/Icon'

const CATS: NoticeCategory[] = ['notice', 'update', 'event']
const CAT_STYLE: Record<NoticeCategory, string> = {
  notice: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  update: 'bg-volt-500/20 text-volt-700 dark:text-volt-300',
  event: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
}

export default function Notices() {
  const { t, i18n } = useTranslation()
  const user = useAuth((s) => s.user)
  const isAdmin = Boolean(user?.isAdmin)
  const [notices, setNotices] = useState<Notice[] | null>(null)

  const reload = () => listNotices().then(setNotices)
  useEffect(() => {
    reload()
  }, [])

  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">{t('notices.title')}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('notices.subtitle')}</p>
      </div>

      {isAdmin && <Composer onPosted={reload} />}

      {notices === null && <div className="card h-32 animate-pulse" />}

      {notices !== null && notices.length === 0 && (
        <div className="card grid place-items-center gap-2 p-10 text-center">
          <Icon name="info" size={26} className="text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t('notices.empty')}</p>
        </div>
      )}

      <div className="space-y-3">
        {(notices ?? []).map((n) => (
          <article key={n.id} className="card p-5">
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold ${CAT_STYLE[n.category] ?? CAT_STYLE.notice}`}>
                {t(`notices.cat_${n.category}`)}
              </span>
              {n.pinned ? (
                <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-[11px] font-extrabold text-white dark:bg-white dark:text-black">
                  {t('notices.pinned')}
                </span>
              ) : null}
              <span className="ml-auto text-[11px] font-bold text-zinc-400 dark:text-zinc-600">{fmtDate(n.created_at)}</span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(t('notices.confirmDelete')) && (await deleteNotice(n.id))) reload()
                  }}
                  className="text-[11px] font-bold text-red-500 hover:underline"
                >
                  {t('notices.delete')}
                </button>
              )}
            </div>
            <h2 className="mt-2.5 text-[16px] font-bold tracking-tight">{n.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">{n.body}</p>
            {n.author && (
              <p className="mt-3 text-[11px] font-semibold text-zinc-400 dark:text-zinc-600">— {n.author}</p>
            )}
          </article>
        ))}
      </div>

      {notices !== null && notices.length === 0 && !isAdmin && (
        <p className="text-center text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('notices.needBackend')}</p>
      )}
    </div>
  )
}

function Composer({ onPosted }: { onPosted: () => void }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<NoticeCategory>('notice')
  const [pinned, setPinned] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(false)

  const submit = async () => {
    if (!title.trim() || !body.trim()) return
    setBusy(true)
    setErr(false)
    const ok = await createNotice({ title: title.trim(), body: body.trim(), category, pinned })
    setBusy(false)
    if (ok) {
      setTitle('')
      setBody('')
      setPinned(false)
      onPosted()
    } else {
      setErr(true)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-volt-500 dark:border-white/10 dark:bg-white/5'

  return (
    <section className="card space-y-2.5 p-4">
      <h2 className="text-[13px] font-extrabold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        {t('notices.compose')}
      </h2>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('notices.formTitle')} className={inputCls} />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('notices.formBody')}
        rows={4}
        className={inputCls}
      />
      <div className="flex flex-wrap items-center gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value as NoticeCategory)} className={`${inputCls} w-auto`}>
          {CATS.map((c) => (
            <option key={c} value={c}>
              {t(`notices.cat_${c}`)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="accent-volt-500" />
          {t('notices.formPin')}
        </label>
        <button
          type="button"
          disabled={busy || !title.trim() || !body.trim()}
          onClick={submit}
          className="ml-auto rounded-lg bg-volt-400 px-4 py-2 text-sm font-bold text-black transition-colors enabled:hover:bg-volt-300 disabled:opacity-40"
        >
          {busy ? t('notices.posting') : t('notices.post')}
        </button>
      </div>
      {err && <p className="text-[12px] font-bold text-red-500">{t('notices.postFail')}</p>}
    </section>
  )
}
