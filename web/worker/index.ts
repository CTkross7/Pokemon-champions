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
import { handleAuth, type AuthEnv } from './auth'

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

  // /api/samples
  if (parts[0] === 'samples' && parts.length === 1) {
    if (request.method === 'GET') {
      const { results } = await db
        .prepare('SELECT id, title, author, likes, views, created_at FROM samples ORDER BY created_at DESC LIMIT 50')
        .all()
      return json({ samples: results ?? [] })
    }
    if (request.method === 'POST') {
      let body: Record<string, unknown>
      try {
        body = (await request.json()) as Record<string, unknown>
      } catch {
        return json({ error: 'invalid_json' }, 400)
      }
      const title = clampStr(body.title, 60).trim() || '무제 팀'
      const author = clampStr(body.author, 30).trim() || '익명'
      const team = clampStr(body.team, MAX_TEAM_BYTES)
      if (!team) return json({ error: 'missing_team' }, 400)
      const id = crypto.randomUUID().slice(0, 8)
      await db
        .prepare('INSERT INTO samples (id, title, author, team, likes, views, created_at) VALUES (?, ?, ?, ?, 0, 0, ?)')
        .bind(id, title, author, team, Date.now())
        .run()
      return json({ id }, 201)
    }
    return json({ error: 'method_not_allowed' }, 405)
  }

  // /api/samples/:id  and  /api/samples/:id/like
  if (parts[0] === 'samples' && parts[1]) {
    const id = parts[1]
    if (parts[2] === 'like' && request.method === 'POST') {
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
    return json({ error: 'method_not_allowed' }, 405)
  }

  return json({ error: 'not_found' }, 404)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/auth')) {
      try {
        return await handleAuth(request, env, url)
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
    // Everything else: static assets (with SPA fallback via wrangler.toml).
    return env.ASSETS.fetch(request)
  },
}
