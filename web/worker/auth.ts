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
  /** Comma-separated usernames granted admin (notices, moderation). */
  ADMIN_USERNAMES?: string
}

interface UserRow {
  id: string
  username: string
  display_name: string
  email: string | null
  provider: string
  provider_id: string
  avatar_url: string | null
  password_hash: string | null
  display_name_changed_at: number | null
  username_changed_at: number | null
  onboarded: number
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

/** True when the username is listed in the ADMIN_USERNAMES env (comma-separated). */
export function isAdmin(env: AuthEnv, username: string | null | undefined): boolean {
  if (!username) return false
  const list = (env.ADMIN_USERNAMES ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(username.toLowerCase())
}

const RENAME_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

const publicUser = (u: UserRow, admin = false) => ({
  id: u.id,
  username: u.username,
  displayName: u.display_name,
  email: u.email,
  provider: u.provider,
  avatarUrl: u.avatar_url,
  createdAt: u.created_at,
  isAdmin: admin,
  onboarded: u.onboarded !== 0,
  // ms until the display name can be changed again (0 = now)
  renameAvailableInMs: Math.max(0, (u.display_name_changed_at ?? 0) + RENAME_COOLDOWN_MS - Date.now()),
  // ms until the username (@handle) can be changed again (0 = now)
  usernameRenameAvailableInMs: Math.max(0, (u.username_changed_at ?? 0) + RENAME_COOLDOWN_MS - Date.now()),
})

// ---- password hashing (PBKDF2-SHA256) --------------------------------------

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
const PBKDF2_ITERS = 100_000

async function hashPassword(password: string, salt?: Uint8Array): Promise<string> {
  const s = salt ?? crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: s, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    key,
    256,
  )
  return `pbkdf2$${PBKDF2_ITERS}$${b64(s)}$${b64(new Uint8Array(bits))}`
}

async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false
  const [scheme, iters, saltB64, hashB64] = stored.split('$')
  if (scheme !== 'pbkdf2') return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: unb64(saltB64), iterations: Number(iters), hash: 'SHA-256' },
    key,
    256,
  )
  return b64(new Uint8Array(bits)) === hashB64
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// ---- session helpers -------------------------------------------------------

export async function currentUser(db: D1Database, request: Request): Promise<UserRow | null> {
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
  // New OAuth users pick their own username on first login (onboarded = 0).
  await db
    .prepare(
      `INSERT INTO users (id, username, display_name, email, provider, provider_id, avatar_url, onboarded, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
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
        email: Boolean(env.DB), // email+password needs the D1 database
      },
    })
  }

  if (!db) return json({ error: 'auth_not_configured' }, 503)
  // Trailing slashes on APP_URL would produce "…//api/auth/…" and break the
  // exact redirect_uri match Google requires, so normalize them away.
  const appUrl = (env.APP_URL || url.origin).replace(/\/+$/, '')

  if (path === 'me') {
    const user = await currentUser(db, request)
    return json({ user: user ? publicUser(user, isAdmin(env, user.username)) : null })
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

  // ---- Email + password sign-up / login -----------------------------------
  if (path === 'signup' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const email = String(body.email ?? '').trim().toLowerCase()
    const username = String(body.username ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    if (!EMAIL_RE.test(email)) return json({ error: 'invalid_email' }, 400)
    if (!USERNAME_RE.test(username)) return json({ error: 'invalid_username' }, 400)
    if (password.length < 8) return json({ error: 'weak_password' }, 400)
    if (await db.prepare("SELECT 1 FROM users WHERE provider = 'email' AND provider_id = ?").bind(email).first())
      return json({ error: 'email_taken' }, 409)
    if (await db.prepare('SELECT 1 FROM users WHERE username = ?').bind(username).first())
      return json({ error: 'username_taken' }, 409)
    const id = crypto.randomUUID()
    await db
      .prepare(
        `INSERT INTO users (id, username, display_name, email, provider, provider_id, password_hash, onboarded, created_at)
         VALUES (?, ?, ?, ?, 'email', ?, ?, 1, ?)`,
      )
      .bind(id, username, username, email, email, await hashPassword(password), Date.now())
      .run()
    const session = await createSession(db, id)
    return json({ ok: true }, 201, { 'set-cookie': cookie(SESSION_COOKIE, session, SESSION_TTL_MS / 1000) })
  }

  if (path === 'login' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const idInput = String(body.id ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    if (!idInput || !password) return json({ error: 'missing_fields' }, 400)
    const user = await db
      .prepare("SELECT * FROM users WHERE provider = 'email' AND (provider_id = ? OR username = ?)")
      .bind(idInput, idInput)
      .first<UserRow>()
    if (!user || !(await verifyPassword(password, user.password_hash)))
      return json({ error: 'invalid_credentials' }, 401)
    const session = await createSession(db, user.id)
    return json({ ok: true }, 200, { 'set-cookie': cookie(SESSION_COOKIE, session, SESSION_TTL_MS / 1000) })
  }

  // ---- Onboarding: choose username (new Google users) ---------------------
  if (path === 'username' && request.method === 'POST') {
    const user = await currentUser(db, request)
    if (!user) return json({ error: 'auth_required' }, 401)
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const username = String(body.username ?? '').trim().toLowerCase()
    if (!USERNAME_RE.test(username)) return json({ error: 'invalid_username' }, 400)
    if (await db.prepare('SELECT 1 FROM users WHERE username = ? AND id != ?').bind(username, user.id).first())
      return json({ error: 'username_taken' }, 409)
    await db
      .prepare('UPDATE users SET username = ?, onboarded = 1 WHERE id = ?')
      .bind(username, user.id)
      .run()
    return json({ ok: true })
  }

  // ---- Profile edit (display name w/ 7-day cooldown, avatar) ---------------
  if (path === 'profile' && (request.method === 'PATCH' || request.method === 'POST')) {
    const user = await currentUser(db, request)
    if (!user) return json({ error: 'auth_required' }, 401)
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const now = Date.now()

    if (typeof body.displayName === 'string') {
      const name = body.displayName.trim().slice(0, 24)
      if (name.length < 1) return json({ error: 'invalid_name' }, 400)
      if (name !== user.display_name) {
        const nextAllowed = (user.display_name_changed_at ?? 0) + RENAME_COOLDOWN_MS
        if (now < nextAllowed) return json({ error: 'rename_cooldown', availableInMs: nextAllowed - now }, 429)
        await db
          .prepare('UPDATE users SET display_name = ?, display_name_changed_at = ? WHERE id = ?')
          .bind(name, now, user.id)
          .run()
      }
    }

    if (typeof body.username === 'string') {
      const username = body.username.trim().toLowerCase()
      if (!USERNAME_RE.test(username)) return json({ error: 'invalid_username' }, 400)
      if (username !== user.username) {
        const nextAllowed = (user.username_changed_at ?? 0) + RENAME_COOLDOWN_MS
        if (now < nextAllowed) return json({ error: 'username_cooldown', availableInMs: nextAllowed - now }, 429)
        if (await db.prepare('SELECT 1 FROM users WHERE username = ? AND id != ?').bind(username, user.id).first())
          return json({ error: 'username_taken' }, 409)
        await db
          .prepare('UPDATE users SET username = ?, username_changed_at = ? WHERE id = ?')
          .bind(username, now, user.id)
          .run()
      }
    }

    if (typeof body.avatarUrl === 'string') {
      const avatar = body.avatarUrl
      // Accept a small data: image or an https url; cap size (~200 KB).
      const ok = (avatar.startsWith('data:image/') && avatar.length < 280_000) || /^https:\/\//.test(avatar) || avatar === ''
      if (!ok) return json({ error: 'invalid_avatar' }, 400)
      await db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').bind(avatar || null, user.id).run()
    }

    const fresh = await db.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first<UserRow>()
    return json({ user: fresh ? publicUser(fresh, isAdmin(env, fresh.username)) : null })
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
    // First-time Google users pick a username on /welcome; returning users go
    // straight to their profile.
    const row = await db.prepare('SELECT onboarded FROM users WHERE id = ?').bind(userId).first<{ onboarded: number }>()
    const dest = row && row.onboarded === 0 ? '/welcome' : '/profile'
    return new Response(null, {
      status: 302,
      headers: {
        location: `${appUrl}${dest}`,
        'set-cookie': cookie(SESSION_COOKIE, session, SESSION_TTL_MS / 1000),
      },
    })
  }

  return json({ error: 'not_found' }, 404)
}
