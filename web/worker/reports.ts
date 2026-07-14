/**
 * Reports + admin moderation (Phase 12).
 *
 * User-facing:
 *   POST /api/reports                     file a report (signed-in, not banned)
 *
 * Admin (ADMIN_USERNAMES):
 *   GET  /api/admin/reports               list reports (open first)
 *   POST /api/admin/reports/:id/resolve   { action: 'resolved' | 'dismissed' }
 *   POST /api/admin/users/:id/warn        { note? }   warnings += 1
 *   POST /api/admin/users/:id/ban         { days, note? }  temporary ban
 *   POST /api/admin/users/:id/unban
 *   DELETE /api/admin/samples/:id         remove reported content
 */
import type { D1Database } from './d1'
import { currentUser, isAdmin, type AuthEnv } from './auth'

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' }
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: JSON_HEADERS })

const clampStr = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
const TARGETS = new Set(['sample', 'notice', 'user'])
const REASONS = new Set(['spam', 'abuse', 'inappropriate', 'other'])

/** True when the user currently has an active temporary ban. */
export async function isBanned(db: D1Database, userId: string): Promise<boolean> {
  const row = await db
    .prepare('SELECT banned_until FROM moderation WHERE user_id = ?')
    .bind(userId)
    .first<{ banned_until: number | null }>()
  return Boolean(row?.banned_until && row.banned_until > Date.now())
}

export async function handleReports(request: Request, env: AuthEnv, url: URL): Promise<Response> {
  const db = env.DB
  if (!db) return json({ error: 'not_configured' }, 503)

  // POST /api/reports — any signed-in (non-banned) user
  if (url.pathname === '/api/reports' && request.method === 'POST') {
    const user = await currentUser(db, request)
    if (!user) return json({ error: 'auth_required' }, 401)
    if (await isBanned(db, user.id)) return json({ error: 'banned' }, 403)
    let body: Record<string, unknown>
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return json({ error: 'invalid_json' }, 400)
    }
    const targetType = String(body.targetType ?? '')
    const targetId = clampStr(body.targetId, 64).trim()
    const reason = String(body.reason ?? '')
    if (!TARGETS.has(targetType) || !targetId || !REASONS.has(reason)) return json({ error: 'invalid_fields' }, 400)
    const id = crypto.randomUUID().slice(0, 12)
    await db
      .prepare(
        'INSERT INTO reports (id, target_type, target_id, reason, detail, reporter_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(id, targetType, targetId, reason, clampStr(body.detail, 1000).trim() || null, user.id, 'open', Date.now())
      .run()
    return json({ id }, 201)
  }

  return json({ error: 'not_found' }, 404)
}

export async function handleAdmin(request: Request, env: AuthEnv, url: URL): Promise<Response> {
  const db = env.DB
  if (!db) return json({ error: 'not_configured' }, 503)
  const admin = await currentUser(db, request)
  if (!admin || !isAdmin(env, admin.username)) return json({ error: 'forbidden' }, 403)

  const parts = url.pathname.replace(/^\/api\/admin\/?/, '').split('/').filter(Boolean)

  // GET /api/admin/reports
  if (parts[0] === 'reports' && parts.length === 1 && request.method === 'GET') {
    const { results } = await db
      .prepare(
        `SELECT r.*, u.username AS reporter_username,
                m.warnings AS reporter_warnings
         FROM reports r
         JOIN users u ON u.id = r.reporter_id
         LEFT JOIN moderation m ON m.user_id = r.reporter_id
         ORDER BY CASE r.status WHEN 'open' THEN 0 ELSE 1 END, r.created_at DESC
         LIMIT 200`,
      )
      .all()
    return json({ reports: results ?? [] })
  }

  // POST /api/admin/reports/:id/resolve
  if (parts[0] === 'reports' && parts[1] && parts[2] === 'resolve' && request.method === 'POST') {
    let body: Record<string, unknown> = {}
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      /* default */
    }
    const action = body.action === 'dismissed' ? 'dismissed' : 'resolved'
    await db
      .prepare('UPDATE reports SET status = ?, resolved_by = ?, resolved_at = ? WHERE id = ?')
      .bind(action, admin.username, Date.now(), parts[1])
      .run()
    return json({ ok: true })
  }

  // POST /api/admin/users/:id/(warn|ban|unban)
  if (parts[0] === 'users' && parts[1] && parts[2] && request.method === 'POST') {
    const userId = parts[1]
    let body: Record<string, unknown> = {}
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      /* default */
    }
    const note = clampStr(body.note, 500).trim() || null
    const now = Date.now()
    if (parts[2] === 'warn') {
      await db
        .prepare(
          `INSERT INTO moderation (user_id, warnings, note, updated_at) VALUES (?, 1, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET warnings = warnings + 1, note = excluded.note, updated_at = excluded.updated_at`,
        )
        .bind(userId, note, now)
        .run()
      return json({ ok: true })
    }
    if (parts[2] === 'ban') {
      const days = Math.min(Math.max(Number(body.days) || 3, 1), 365)
      const until = now + days * 24 * 60 * 60 * 1000
      await db
        .prepare(
          `INSERT INTO moderation (user_id, warnings, banned_until, note, updated_at) VALUES (?, 0, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET banned_until = excluded.banned_until, note = excluded.note, updated_at = excluded.updated_at`,
        )
        .bind(userId, until, note, now)
        .run()
      return json({ ok: true, bannedUntil: until })
    }
    if (parts[2] === 'unban') {
      await db
        .prepare(
          `INSERT INTO moderation (user_id, warnings, banned_until, updated_at) VALUES (?, 0, NULL, ?)
           ON CONFLICT(user_id) DO UPDATE SET banned_until = NULL, updated_at = excluded.updated_at`,
        )
        .bind(userId, now)
        .run()
      return json({ ok: true })
    }
  }

  // DELETE /api/admin/samples/:id — remove reported content
  if (parts[0] === 'samples' && parts[1] && request.method === 'DELETE') {
    await db.prepare('DELETE FROM samples WHERE id = ?').bind(parts[1]).run()
    return json({ ok: true })
  }

  return json({ error: 'not_found' }, 404)
}
