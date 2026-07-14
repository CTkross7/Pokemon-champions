/**
 * Auth client + store. Talks to the Worker auth backend (`/api/auth/*`).
 * Accounts are real: sign in with Google OR email + password. New Google users
 * pick a username on first login (onboarding). The last resolved user is cached
 * locally for instant UI; the server session cookie is the source of truth.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Provider = 'google' | 'email'

export interface AuthUser {
  id: string
  username: string
  displayName: string
  email: string | null
  provider: Provider
  avatarUrl: string | null
  createdAt: number
  isAdmin?: boolean
  onboarded?: boolean
  /** ms until the display name may be changed again (0 = now). */
  renameAvailableInMs?: number
  /** ms until the username (@handle) may be changed again (0 = now). */
  usernameRenameAvailableInMs?: number
}

export interface ProviderConfig {
  google: boolean
  email: boolean
}

/** Usernames: 3–20 chars, lowercase letters, digits, underscore. */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/
export const isValidUsername = (u: string) => USERNAME_RE.test(u.trim().toLowerCase())

export type CheckResult = 'invalid' | 'available' | 'taken' | 'unknown'

export async function checkUsername(username: string): Promise<CheckResult> {
  const u = username.trim().toLowerCase()
  if (!isValidUsername(u)) return 'invalid'
  try {
    const res = await fetch(`/api/auth/username-available?u=${encodeURIComponent(u)}`)
    if (!res.ok) return 'unknown'
    const body = (await res.json()) as { available?: boolean }
    return body.available ? 'available' : 'taken'
  } catch {
    return 'unknown'
  }
}

async function fetchConfig(): Promise<ProviderConfig> {
  try {
    const res = await fetch('/api/auth/config')
    if (!res.ok) return { google: false, email: false }
    const body = (await res.json()) as { providers?: Partial<ProviderConfig> }
    return { google: Boolean(body.providers?.google), email: Boolean(body.providers?.email) }
  } catch {
    return { google: false, email: false }
  }
}

// 'unreachable' distinguishes "no backend here" (keep cached user) from a
// reachable backend that reports no session (clear the user — really logged out).
async function fetchMe(): Promise<AuthUser | null | 'unreachable'> {
  try {
    const res = await fetch('/api/auth/me')
    if (!res.ok) return 'unreachable'
    const body = (await res.json()) as { user?: AuthUser | null }
    return body.user ?? null
  } catch {
    return 'unreachable'
  }
}

interface AuthState {
  user: AuthUser | null
  providers: ProviderConfig | null // null = not yet loaded
  ready: boolean
  init: () => Promise<void>
  setUser: (u: AuthUser | null) => void
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      providers: null,
      ready: false,
      init: async () => {
        const [providers, me] = await Promise.all([fetchConfig(), fetchMe()])
        set({ providers, user: me === 'unreachable' ? get().user : me, ready: true })
      },
      setUser: (u) => set({ user: u }),
      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' })
        } catch {
          /* backend unreachable */
        }
        set({ user: null })
      },
    }),
    {
      name: 'champsnote-auth',
      partialize: (s) => ({ user: s.user }),
    },
  ),
)

/** Refresh the cached user from the server session (after login/signup/edit). */
async function refreshUser() {
  const me = await fetchMe()
  if (me !== 'unreachable') useAuth.getState().setUser(me)
}

export const startGoogleLogin = () => {
  window.location.href = '/api/auth/google/start'
}

type AuthError =
  | 'invalid_email'
  | 'invalid_username'
  | 'weak_password'
  | 'email_taken'
  | 'username_taken'
  | 'invalid_credentials'
  | 'missing_fields'
  | 'error'
export type AuthResult = { ok: true } | { ok: false; error: AuthError }

async function postAuth(path: string, body: unknown): Promise<AuthResult> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      await refreshUser()
      return { ok: true }
    }
    const b = (await res.json().catch(() => ({}))) as { error?: string }
    return { ok: false, error: (b.error as AuthError) ?? 'error' }
  } catch {
    return { ok: false, error: 'error' }
  }
}

export const signupEmail = (email: string, username: string, password: string) =>
  postAuth('/api/auth/signup', { email, username, password })

export const loginEmail = (id: string, password: string) => postAuth('/api/auth/login', { id, password })

/** Onboarding: a signed-in (Google) user claims their username. */
export const setUsername = (username: string) => postAuth('/api/auth/username', { username })

export type ProfileError = 'rename_cooldown' | 'username_cooldown' | 'username_taken' | 'invalid_username' | 'invalid_avatar' | 'error'
export type ProfileResult = { ok: true } | { ok: false; error: ProfileError; availableInMs?: number }

export async function updateProfile(patch: {
  displayName?: string
  username?: string
  avatarUrl?: string
}): Promise<ProfileResult> {
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const body = (await res.json()) as { user?: AuthUser | null }
      if (body.user) useAuth.getState().setUser(body.user)
      return { ok: true }
    }
    const b = (await res.json().catch(() => ({}))) as { error?: string; availableInMs?: number }
    return { ok: false, error: (b.error as ProfileError) ?? 'error', availableInMs: b.availableInMs }
  } catch {
    return { ok: false, error: 'error' }
  }
}
