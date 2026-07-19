/**
 * ChampsNote Worker: serves the static SPA and, when a D1 database is bound,
 * exposes a small public-sample gallery API. The API is OPTIONAL — with no DB
 * bound, /api/* returns 503 and the rest of the site works exactly as before,
 * so enabling the gallery never risks the static deployment.
 *
 * Routes:
 *   GET  /api/samples            list recent public samples (newest first)
 *   POST /api/samples            create a sample { title, author, team }
 *   GET  /api/samples/:id        fetch one sample (increments view count)
 *   POST /api/samples/:id/like   increment like count
 */
import type { D1Database } from './d1'
import { handleAuth, currentUser, isAdmin, type AuthEnv } from './auth'
import { handleNotices } from './notices'
import { handleReports, handleAdmin, isBanned } from './reports'
import { ensureSchema } from './migrate'

export interface Env extends AuthEnv {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  DB?: D1Database
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' }
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: JSON_HEADERS })

const MAX_TEAM_BYTES = 8 * 1024
const clampStr = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  if (!env.DB) return json({ error: 'gallery_not_configured' }, 503)
  const db = env.DB
  const parts = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean)

  // /api/data/teams — per-user cloud store for saved teams (survives logout /
  // syncs across devices). GET returns the blob; PUT replaces it. Sign-in only.
  if (parts[0] === 'data' && parts[1] === 'teams') {
    const user = await currentUser(db, request)
    if (!user) return json({ error: 'auth_required' }, 401)
    if (request.method === 'GET') {
      const row = await db.prepare('SELECT data FROM user_teams WHERE user_id = ?').bind(user.id).first<{ data: string }>()
      let teams: unknown = []
      let deletedIds: unknown = []
      try {
        const parsed = row ? JSON.parse(row.data) : null
        if (Array.isArray(parsed)) {
          teams = parsed // legacy blob: a bare teams array
        } else if (parsed && typeof parsed === 'object') {
          teams = Array.isArray((parsed as { teams?: unknown }).teams) ? (parsed as { teams: unknown }).teams : []
          deletedIds = Array.isArray((parsed as { deletedIds?: unknown }).deletedIds)
            ? (parsed as { deletedIds: unknown }).deletedIds
            : []
        }
      } catch {
        teams = []
      }
      return json({ teams, deletedIds })
    }
    if (request.method === 'PUT') {
      const body = (await request.json().catch(() => ({}))) as { teams?: unknown; deletedIds?: unknown }
      if (!Array.isArray(body.teams)) return json({ error: 'invalid' }, 400)
      // Tombstones for deleted team ids, so deletions sync across devices.
      const deletedIds = Array.isArray(body.deletedIds)
        ? body.deletedIds.filter((x): x is string => typeof x === 'string').slice(-500)
        : []
      const data = JSON.stringify({ teams: body.teams, deletedIds }).slice(0, 200_000) // ~200 KB cap
      await db
        .prepare(
          'INSERT INTO user_teams (user_id, data, updated_at) VALUES (?, ?, ?) ' +
            'ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
        )
        .bind(user.id, data, Date.now())
        .run()
      return json({ ok: true })
    }
    return json({ error: 'method_not_allowed' }, 405)
  }

  // /api/samples
  if (parts[0] === 'samples' && parts.length === 1) {
    if (request.method === 'GET') {
      // Optional ?regulation= and ?kind=(team|mon) filters; comment count via
      // correlated subquery. kind: NULL rows are legacy teams, so a 'team'
      // filter also matches NULL.
      const reg = url.searchParams.get('regulation')
      const kind = url.searchParams.get('kind')
      const where: string[] = []
      const binds: string[] = []
      if (reg) {
        where.push('regulation = ?')
        binds.push(reg)
      }
      if (kind === 'mon') {
        where.push("kind = 'mon'")
      } else if (kind === 'team') {
        where.push("(kind = 'team' OR kind IS NULL)")
      }
      // sort=popular ranks by likes (then recency); default is newest-first.
      const orderBy = url.searchParams.get('sort') === 'popular' ? 'likes DESC, created_at DESC' : 'created_at DESC'
      const listSql =
        "SELECT id, title, author, team, likes, views, regulation, owner_id, description, COALESCE(kind, 'team') AS kind, created_at, " +
        '(SELECT COUNT(*) FROM comments c WHERE c.sample_id = samples.id) AS comments ' +
        'FROM samples' +
        (where.length ? ' WHERE ' + where.join(' AND ') : '') +
        ` ORDER BY ${orderBy} LIMIT 50`
      const stmt = binds.length ? db.prepare(listSql).bind(...binds) : db.prepare(listSql)
      const { results } = await stmt.all()
      // Distinct regulations present, for the filter chips.
      const { results: regs } = await db
        .prepare("SELECT DISTINCT regulation FROM samples WHERE regulation IS NOT NULL AND regulation != '' ORDER BY regulation")
        .all<{ regulation: string }>()
      return json({ samples: results ?? [], regulations: (regs ?? []).map((r) => r.regulation) })
    }
    if (request.method === 'POST') {
      // Publishing a sample requires a signed-in, non-banned account.
      const user = await currentUser(db, request)
      if (!user) return json({ error: 'auth_required' }, 401)
      if (await isBanned(db, user.id)) return json({ error: 'banned' }, 403)
      let body: Record<string, unknown>
      try {
        body = (await request.json()) as Record<string, unknown>
      } catch {
        return json({ error: 'invalid_json' }, 400)
      }
      const title = clampStr(body.title, 60).trim() || '무제 팀'
      // Author is always the signed-in user's display name (synced from profile),
      // never a client-supplied or anonymous value.
      const author = user.display_name || user.username
      const team = clampStr(body.team, MAX_TEAM_BYTES)
      if (!team) return json({ error: 'missing_team' }, 400)
      const regulation = clampStr(body.regulation, 20).trim() || null
      const description = clampStr(body.description, 500).trim() || null
      const kind = body.kind === 'mon' ? 'mon' : 'team'
      const id = crypto.randomUUID().slice(0, 8)
      await db
        .prepare(
          'INSERT INTO samples (id, title, author, team, likes, views, owner_id, regulation, description, kind, created_at) VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)',
        )
        .bind(id, title, author, team, user.id, regulation, description, kind, Date.now())
        .run()
      return json({ id }, 201)
    }
    return json({ error: 'method_not_allowed' }, 405)
  }

  // /api/samples/:id[/like|/comments[/:cid]]
  if (parts[0] === 'samples' && parts[1]) {
    const id = parts[1]

    // ---- Comments ----
    if (parts[2] === 'comments') {
      if (request.method === 'GET') {
        const { results } = await db
          .prepare('SELECT id, user_id, author, body, created_at FROM comments WHERE sample_id = ? ORDER BY created_at ASC LIMIT 200')
          .bind(id)
          .all()
        return json({ comments: results ?? [] })
      }
      if (request.method === 'POST' && !parts[3]) {
        const user = await currentUser(db, request)
        if (!user) return json({ error: 'auth_required' }, 401)
        if (await isBanned(db, user.id)) return json({ error: 'banned' }, 403)
        const exists = await db.prepare('SELECT 1 FROM samples WHERE id = ?').bind(id).first()
        if (!exists) return json({ error: 'not_found' }, 404)
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
        const text = clampStr(body.body, 500).trim()
        if (!text) return json({ error: 'empty' }, 400)
        const cid = crypto.randomUUID().slice(0, 10)
        await db
          .prepare('INSERT INTO comments (id, sample_id, user_id, author, body, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(cid, id, user.id, user.display_name || user.username, text, Date.now())
          .run()
        return json({ id: cid }, 201)
      }
      // DELETE /api/samples/:id/comments/:cid — comment owner or admin
      if (request.method === 'DELETE' && parts[3]) {
        const user = await currentUser(db, request)
        if (!user) return json({ error: 'auth_required' }, 401)
        const row = await db.prepare('SELECT user_id FROM comments WHERE id = ?').bind(parts[3]).first<{ user_id: string }>()
        if (!row) return json({ error: 'not_found' }, 404)
        if (row.user_id !== user.id && !isAdmin(env, user.username)) return json({ error: 'forbidden' }, 403)
        await db.prepare('DELETE FROM comments WHERE id = ?').bind(parts[3]).run()
        return json({ ok: true })
      }
      return json({ error: 'method_not_allowed' }, 405)
    }

    if (parts[2] === 'like' && request.method === 'POST') {
      const user = await currentUser(db, request)
      if (!user) return json({ error: 'auth_required' }, 401)
      if (await isBanned(db, user.id)) return json({ error: 'banned' }, 403)
      await db.prepare('UPDATE samples SET likes = likes + 1 WHERE id = ?').bind(id).run()
      const row = await db.prepare('SELECT likes FROM samples WHERE id = ?').bind(id).first<{ likes: number }>()
      return row ? json({ likes: row.likes }) : json({ error: 'not_found' }, 404)
    }
    if (request.method === 'GET') {
      const row = await db.prepare('SELECT * FROM samples WHERE id = ?').bind(id).first()
      if (!row) return json({ error: 'not_found' }, 404)
      await db.prepare('UPDATE samples SET views = views + 1 WHERE id = ?').bind(id).run()
      return json({ sample: row })
    }
    // DELETE /api/samples/:id — owner or admin
    if (request.method === 'DELETE') {
      const user = await currentUser(db, request)
      if (!user) return json({ error: 'auth_required' }, 401)
      const row = await db.prepare('SELECT owner_id FROM samples WHERE id = ?').bind(id).first<{ owner_id: string | null }>()
      if (!row) return json({ error: 'not_found' }, 404)
      if (row.owner_id !== user.id && !isAdmin(env, user.username)) return json({ error: 'forbidden' }, 403)
      await db.prepare('DELETE FROM samples WHERE id = ?').bind(id).run()
      await db.prepare('DELETE FROM comments WHERE sample_id = ?').bind(id).run()
      return json({ ok: true })
    }
    return json({ error: 'method_not_allowed' }, 405)
  }

  return json({ error: 'not_found' }, 404)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    // Bring the D1 schema forward before any DB-backed route touches it, so a
    // live install never fails on a missing column (e.g. profile edits).
    if (env.DB && url.pathname.startsWith('/api/')) await ensureSchema(env.DB)
    if (url.pathname.startsWith('/api/auth')) {
      try {
        return await handleAuth(request, env, url)
      } catch (err) {
        return json({ error: 'server_error', detail: String(err) }, 500)
      }
    }
    if (url.pathname.startsWith('/api/notices')) {
      try {
        return await handleNotices(request, env, url)
      } catch (err) {
        return json({ error: 'server_error', detail: String(err) }, 500)
      }
    }
    if (url.pathname.startsWith('/api/reports')) {
      try {
        return await handleReports(request, env, url)
      } catch (err) {
        return json({ error: 'server_error', detail: String(err) }, 500)
      }
    }
    if (url.pathname.startsWith('/api/admin')) {
      try {
        return await handleAdmin(request, env, url)
      } catch (err) {
        return json({ error: 'server_error', detail: String(err) }, 500)
      }
    }
    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env, url)
      } catch (err) {
        return json({ error: 'server_error', detail: String(err) }, 500)
      }
    }
    // Everything else: static assets. On Workers the SPA fallback comes from
    // wrangler.toml (not_found_handling); on Pages advanced mode (_worker.js)
    // we serve index.html for client-side routes that don't map to a file.
    const res = await env.ASSETS.fetch(request)
    if (
      res.status === 404 &&
      request.method === 'GET' &&
      (request.headers.get('accept') || '').includes('text/html')
    ) {
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request))
    }
    return res
  },
}
