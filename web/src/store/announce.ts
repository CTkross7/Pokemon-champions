import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { listNotices, type Notice } from '@/lib/notices'

/**
 * Announcement / unread-notice state.
 *
 *  • `lastReadNoticeAt` — the newest notice `created_at` the user has already
 *    seen. Anything newer counts as unread (drives the red dot + access popup).
 *  • `popupSuppressedUntil` — epoch ms; while `Date.now()` is below it the
 *    access popup stays hidden ("오늘 하루 보지 않기").
 *
 * The fetched `notices` list is runtime-only (never persisted) so it always
 * reflects the live board. Only the two prefs above survive reloads.
 */
interface AnnounceState {
  lastReadNoticeAt: number
  popupSuppressedUntil: number
  notices: Notice[]
  loaded: boolean
  refresh: () => Promise<void>
  markRead: () => void
  suppressPopupToday: () => void
}

/** End of *today* in local time — the suppress checkbox lasts until midnight. */
function endOfToday(): number {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

export const useAnnounce = create<AnnounceState>()(
  persist(
    (set, get) => ({
      lastReadNoticeAt: 0,
      popupSuppressedUntil: 0,
      notices: [],
      loaded: false,
      refresh: async () => {
        const notices = await listNotices()
        set({ notices, loaded: true })
      },
      // Mark everything currently loaded as read (newest wins).
      markRead: () => {
        const newest = get().notices.reduce((m, n) => Math.max(m, n.created_at), 0)
        set({ lastReadNoticeAt: Math.max(get().lastReadNoticeAt, newest, 1) })
      },
      suppressPopupToday: () => set({ popupSuppressedUntil: endOfToday() }),
    }),
    {
      name: 'champsnote-announce',
      // Persist only the prefs; the notices list is always re-fetched fresh.
      partialize: (s) => ({
        lastReadNoticeAt: s.lastReadNoticeAt,
        popupSuppressedUntil: s.popupSuppressedUntil,
      }),
    },
  ),
)

/** Notices newer than the last-read marker (unread). */
export function unreadNotices(s: Pick<AnnounceState, 'notices' | 'lastReadNoticeAt'>): Notice[] {
  return s.notices.filter((n) => n.created_at > s.lastReadNoticeAt)
}
