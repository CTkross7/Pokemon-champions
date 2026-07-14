/** Reports + admin moderation client (Phase 12). */

export type ReportTarget = 'sample' | 'notice' | 'user'
export type ReportReason = 'spam' | 'abuse' | 'inappropriate' | 'other'

export interface ReportInput {
  targetType: ReportTarget
  targetId: string
  reason: ReportReason
  detail?: string
}

export type ReportResult = 'ok' | 'auth' | 'banned' | 'error'

export async function createReport(input: ReportInput): Promise<ReportResult> {
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (res.status === 401) return 'auth'
    if (res.status === 403) return 'banned'
    return res.ok ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}

export interface AdminReport {
  id: string
  target_type: ReportTarget
  target_id: string
  reason: ReportReason
  detail: string | null
  reporter_id: string
  reporter_username: string
  status: 'open' | 'resolved' | 'dismissed'
  resolved_by: string | null
  created_at: number
}

export async function listAdminReports(): Promise<AdminReport[] | 'forbidden' | null> {
  try {
    const res = await fetch('/api/admin/reports')
    if (res.status === 403) return 'forbidden'
    if (!res.ok) return null
    const body = (await res.json()) as { reports?: AdminReport[] }
    return body.reports ?? []
  } catch {
    return null
  }
}

const post = async (path: string, body?: unknown): Promise<boolean> => {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    })
    return res.ok
  } catch {
    return false
  }
}

export const resolveReport = (id: string, action: 'resolved' | 'dismissed') =>
  post(`/api/admin/reports/${id}/resolve`, { action })
export const warnUser = (userId: string, note?: string) => post(`/api/admin/users/${userId}/warn`, { note })
export const banUser = (userId: string, days: number, note?: string) =>
  post(`/api/admin/users/${userId}/ban`, { days, note })
export const unbanUser = (userId: string) => post(`/api/admin/users/${userId}/unban`)

export async function adminDeleteSample(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/samples/${id}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}
