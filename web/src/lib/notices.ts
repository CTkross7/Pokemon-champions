/**
 * Notices / announcements client (Phase 12). Reads the public board and, for
 * admins, creates/deletes posts. Degrades gracefully: with no backend it
 * resolves to an empty list so the page shows a friendly empty state.
 */
export type NoticeCategory = 'notice' | 'update' | 'event'

export interface Notice {
  id: string
  title: string
  body: string
  category: NoticeCategory
  pinned: number
  author: string | null
  created_at: number
}

/** Loads notices; empty array if the backend isn't set up. */
export async function listNotices(): Promise<Notice[]> {
  try {
    const res = await fetch('/api/notices')
    if (!res.ok) return []
    const body = (await res.json()) as { notices?: Notice[] }
    return body.notices ?? []
  } catch {
    return []
  }
}

export interface NewNotice {
  title: string
  body: string
  category: NoticeCategory
  pinned: boolean
}

/** Creates a notice (admin only). Returns true on success. */
export async function createNotice(input: NewNotice): Promise<boolean> {
  try {
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Deletes a notice (admin only). Returns true on success. */
export async function deleteNotice(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notices/${id}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}
