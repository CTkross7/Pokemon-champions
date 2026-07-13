/**
 * Notices / announcements board (Phase 12). Public read; admin-only write.
 * Admins are the usernames listed in the ADMIN_USERNAMES env var. With no D1
 * bound the routes return 503 and the UI shows a friendly empty state.
 *
 *   GET    /api/notices        list (newest first, pinned on top)
 *   POST   /api/notices        create { title, body, category, pinned }  (admin)
 *   DELETE /api/notices/:id     delete                                    (admin)
 */
import type { D1Database } from './d1'
import { currentUser, isAdmin, type AuthEnv } from './auth'

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' }
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: JSON_HEADERS })

const clampStr = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
const CATEGORIES = new Set(['notice', 'update', 'event'])

async function requireAdmin(db: D1Database, env: AuthEnv, request: Request) {
  const user = await currentUser(db, request)
  return user && isAdmin(env, user.username) ? user : null
}

export async function handleNotices(request: Request, env: AuthEnv, url: URL): Promise<Response> {
  const db = env.DB
  if (!db) return json({ error: 'notices_not_configured' }, 503)
  const parts = url.pathname.replace(/^\/api\/notices\/?/, '').split('/').filter(Boolean)

  // GET /api/notices — public list
  if (parts.length === 0 && request.method === 'GET') {
    const { results } = await db
      .prepare(
        'SELECT id, title, body, category, pinned, author, created_at FROM notices ORDER BY pinned DESC, created_at DESC LIMIT 100',
      )
      .all()
    return json({ notices: results ?? [] })
  }

  // POST /api/notices — admin create
  if (parts.length === 0 && request.method === 'POST') {
    const admin = await requireAdmin(db, env, request)
    if (!admin) return json({ error: 'forbidden' }, 403)
    let body: Record<string, unknown>
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return json({ error: 'invalid_json' }, 400)
    }
    const title = clampStr(body.title, 120).trim()
    const text = clampStr(body.body, 8000).trim()
    if (!title || !text) return json({ error: 'missing_fields' }, 400)
    const category = CATEGORIES.has(String(body.category)) ? String(body.category) : 'notice'
    const pinned = body.pinned ? 1 : 0
    const id = crypto.randomUUID().slice(0, 12)
    await db
      .prepare(
        'INSERT INTO notices (id, title, body, category, pinned, author, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(id, title, text, category, pinned, admin.display_name, Date.now())
      .run()
    return json({ id }, 201)
  }

  // DELETE /api/notices/:id — admin delete
  if (parts.length === 1 && request.method === 'DELETE') {
    const admin = await requireAdmin(db, env, request)
    if (!admin) return json({ error: 'forbidden' }, 403)
    await db.prepare('DELETE FROM notices WHERE id = ?').bind(parts[0]).run()
    return json({ ok: true })
  }

  return json({ error: 'not_found' }, 404)
}
