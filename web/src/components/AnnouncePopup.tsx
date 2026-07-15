import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/auth'
import { useAnnounce, unreadNotices } from '@/store/announce'
import type { NoticeCategory } from '@/lib/notices'
import Icon from '@/components/Icon'

const CAT_STYLE: Record<NoticeCategory, string> = {
  notice: 'bg-sky-500/15 text-sky-300',
  update: 'bg-volt-500/20 text-volt-300',
  event: 'bg-violet-500/15 text-violet-300',
}

/**
 * On access, surfaces new notices / patch notes as a dismissible popup so users
 * don't have to open each notice manually. Guests never see it (login-gated to
 * avoid errors on the guest path). "오늘 하루 보지 않기" hides it until midnight
 * while keeping the unread dot; a plain close marks everything read.
 */
export default function AnnouncePopup() {
  const { t, i18n } = useTranslation()
  const user = useAuth((s) => s.user)
  const loaded = useAnnounce((s) => s.loaded)
  const notices = useAnnounce((s) => s.notices)
  const lastReadNoticeAt = useAnnounce((s) => s.lastReadNoticeAt)
  const popupSuppressedUntil = useAnnounce((s) => s.popupSuppressedUntil)
  const markRead = useAnnounce((s) => s.markRead)
  const suppressPopupToday = useAnnounce((s) => s.suppressPopupToday)

  const [dontShowToday, setDontShowToday] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const unread = useMemo(
    () => unreadNotices({ notices, lastReadNoticeAt }),
    [notices, lastReadNoticeAt],
  )

  const suppressed = Date.now() < popupSuppressedUntil
  const open = Boolean(user) && loaded && unread.length > 0 && !suppressed && !dismissed

  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })

  const close = () => {
    if (dontShowToday) suppressPopupToday()
    else markRead()
    setDismissed(true)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label={t('report.close')} onClick={close} />
      <div className="relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-surface-dark shadow-soft">
        <div className="flex items-center gap-2.5 border-b border-white/8 px-5 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-volt-400/15 text-volt-300">
            <Icon name="bell" size={18} />
          </span>
          <div>
            <h2 className="text-[15px] font-extrabold tracking-tight text-white">{t('announce.title')}</h2>
            <p className="text-[12px] text-zinc-400">{t('announce.subtitle', { count: unread.length })}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="ml-auto grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-white/5 hover:text-white"
            aria-label={t('report.close')}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {unread.slice(0, 6).map((n) => (
            <article key={n.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold ${CAT_STYLE[n.category] ?? CAT_STYLE.notice}`}>
                  {t(`notices.cat_${n.category}`)}
                </span>
                <span className="ml-auto text-[11px] font-bold text-zinc-500">{fmtDate(n.created_at)}</span>
              </div>
              <h3 className="mt-2 text-[14px] font-bold text-white">{n.title}</h3>
              <p className="mt-1 line-clamp-4 text-[13px] leading-relaxed whitespace-pre-wrap text-zinc-300">{n.body}</p>
            </article>
          ))}
          {unread.length > 6 && (
            <p className="text-center text-[12px] font-semibold text-zinc-500">
              {t('announce.more', { count: unread.length - 6 })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-white/8 px-5 py-3.5">
          <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-zinc-400 select-none">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="accent-volt-500"
            />
            {t('announce.dontShowToday')}
          </label>
          <button
            type="button"
            onClick={close}
            className="ml-auto rounded-lg bg-volt-400 px-4 py-2 text-[13px] font-bold text-black transition-colors hover:bg-volt-300"
          >
            {t('announce.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
