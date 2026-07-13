/**
 * Account backend for ChampsNote (Cloudflare Worker/Pages + D1).
 *
 * Standard OAuth 2.0 authorization-code flow for Google, plus username
 * uniqueness, session cookies, and profile endpoints. Everything is optional
 * and self-gating: with no D1 bound the routes return 503, and Google only
 * activates when its credentials are present in the environment, so the static
 * site keeps working untouched until the operator configures it.
 *
 * Required environment (set as Worker/Pages secrets / vars):
 *   AUTH_SECRET          random string (session token salt)
 *   APP_URL              public base URL, e.g. https://champsnote.pages.dev
 *   GOOGLE_CLIENT_ID     Google OAuth client id      (enables Google)
 *   GOOGLE_CLIENT_SECRET Google OAuth client secret
 */
import type { D1Database } from './d1'

export interface AuthEnv {
  DB?: D1Database
  AUTH_SECRET?: string
  APP_URL?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
}

interface UserRow {
  id: string
  username: string
  display_name: string
  email: string | null
  provider: string
  provider_id: string
  avatar_url: string | null
  created_at: number
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' }
const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...headers } })

const SESSION_COOKIE = 'cn_session'
const STATE_COOKIE = 'cn_oauth_state'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days
const USERNAME_RE = /^[a-z0-9_]{3,20}$/

// ---- small utilities -------------------------------------------------------

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

function cookie(name: string, value: string, maxAgeSec: number): string {
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
  ]
  return attrs.join('; ')
}

function b64urlDecodeToJson<T>(segment: string): T {
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : ''
  const bin = atob(b64 + pad)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as T
}

/** Decodes a JWT payload without signature verification (id_token from our own
 *  TLS token request is already trusted; we never accept tokens from clients). */
function decodeJwtPayload<T>(jwt: string): T {
  return b64urlDecodeToJson<T>(jwt.split('.')[1] ?? '')
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function slugFromEmailOrName(email: string | null, name: string | null): string {
  const base = (email?.split('@')[0] || name || 'trainer')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 14)
  const safe = base.length >= 3 ? base : `champ${base}`
  return `${safe}_${randomToken().slice(0, 4)}`
}

const publicUser = (u: UserRow) => ({
  id: u.id,
  username: u.username,
  displayName: u.display_name,
  email: u.email,
  provider: u.provider,
  avatarUrl: u.avatar_url,
  createdAt: u.created_at,
})

// ---- session helpers -------------------------------------------------------

async function currentUser(db: D1Database, request: Request): Promise<UserRow | null> {
  const token = parseCookies(request.headers.get('cookie'))[SESSION_COOKIE]
  if (!token) return null
  const row = await db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .bind(token, Date.now())
    .first<UserRow>()
  return row ?? null
}

async function createSession(db: D1Database, userId: string): Promise<string> {
  const token = randomToken()
  await db
    .prepare('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .bind(token, userId, Date.now() + SESSION_TTL_MS, Date.now())
    .run()
  return token
}

/** Finds an existing OAuth user or creates one, returning the user id. */
async function upsertUser(
  db: D1Database,
  provider: string,
  providerId: string,
  email: string | null,
  name: string | null,
  avatar: string | null,
): Promise<string> {
  const existing = await db
    .prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?')
    .bind(provider, providerId)
    .first<UserRow>()
  if (existing) {
    // Refresh mutable profile fields.
    await db
      .prepare('UPDATE users SET email = ?, avatar_url = ? WHERE id = ?')
      .bind(email, avatar, existing.id)
      .run()
    return existing.id
  }
  const id = crypto.randomUUID()
  let username = slugFromEmailOrName(email, name)
  // Guarantee uniqueness on the rare slug collision.
  for (let i = 0; i < 5; i++) {
    const clash = await db.prepare('SELECT 1 FROM users WHERE username = ?').bind(username).first()
    if (!clash) break
    username = slugFromEmailOrName(email, name)
  }
  await db
    .prepare(
      `INSERT INTO users (id, username, display_name, email, provider, provider_id, avatar_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, username, name || username, email, provider, providerId, avatar, Date.now())
    .run()
  return id
}

// ---- route handler ---------------------------------------------------------

export async function handleAuth(request: Request, env: AuthEnv, url: URL): Promise<Response> {
  const path = url.pathname.replace(/^\/api\/auth\/?/, '')
  const db = env.DB

  // Provider availability is queryable even without a DB (UI needs it).
  if (path === 'config') {
    return json({
      providers: {
        google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      },
    })
  }

  if (!db) return json({ error: 'auth_not_configured' }, 503)
  // Trailing slashes on APP_URL would produce "…//api/auth/…" and break the
  // exact redirect_uri match Google requires, so normalize them away.
  const appUrl = (env.APP_URL || url.origin).replace(/\/+$/, '')

  if (path === 'me') {
    const user = await currentUser(db, request)
    return json({ user: user ? publicUser(user) : null })
  }

  if (path === 'logout' && request.method === 'POST') {
    const token = parseCookies(request.headers.get('cookie'))[SESSION_COOKIE]
    if (token) await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
    return json({ ok: true }, 200, { 'set-cookie': cookie(SESSION_COOKIE, '', 0) })
  }

  if (path === 'username-available') {
    const u = (url.searchParams.get('u') ?? '').toLowerCase()
    if (!USERNAME_RE.test(u)) return json({ available: false, reason: 'invalid' })
    const clash = await db.prepare('SELECT 1 FROM users WHERE username = ?').bind(u).first()
    return json({ available: !clash })
  }

  // ---- Google -------------------------------------------------------------
  if (path === 'google/start') {
    if (!env.GOOGLE_CLIENT_ID) return json({ error: 'google_disabled' }, 503)
    const state = randomToken()
    const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    auth.searchParams.set('client_id', env.GOOGLE_CLIENT_ID)
    auth.searchParams.set('redirect_uri', `${appUrl}/api/auth/google/callback`)
    auth.searchParams.set('response_type', 'code')
    auth.searchParams.set('scope', 'openid email profile')
    auth.searchParams.set('state', state)
    auth.searchParams.set('prompt', 'select_account')
    return new Response(null, {
      status: 302,
      headers: { location: auth.toString(), 'set-cookie': cookie(STATE_COOKIE, state, 600) },
    })
  }

  if (path === 'google/callback') {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return json({ error: 'google_disabled' }, 503)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const cookieState = parseCookies(request.headers.get('cookie'))[STATE_COOKIE]
    if (!code || !state || state !== cookieState) return json({ error: 'invalid_state' }, 400)

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })
    if (!tokenRes.ok) return json({ error: 'token_exchange_failed' }, 502)
    const tok = (await tokenRes.json()) as { id_token?: string }
    if (!tok.id_token) return json({ error: 'no_id_token' }, 502)
    const claims = decodeJwtPayload<{ sub: string; email?: string; name?: string; picture?: string }>(tok.id_token)

    const userId = await upsertUser(db, 'google', claims.sub, claims.email ?? null, claims.name ?? null, claims.picture ?? null)
    const session = await createSession(db, userId)
    return new Response(null, {
      status: 302,
      headers: {
        location: `${appUrl}/profile`,
        'set-cookie': cookie(SESSION_COOKIE, session, SESSION_TTL_MS / 1000),
      },
    })
  }

  return json({ error: 'not_found' }, 404)
}
