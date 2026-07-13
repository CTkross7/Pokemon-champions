/**
 * Auth client + store. Talks to the optional Worker auth backend
 * (`/api/auth/*`, Cloudflare Worker + D1). Like the gallery API, every call
 * degrades gracefully: with no backend the app falls back to a local "demo"
 * account stored on-device, so login/profile UI stays functional before the
 * server is deployed. Real Google/Apple sign-in needs the backend + the
 * provider credentials configured in the Worker environment.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Provider = 'google' | 'local'

export interface AuthUser {
  id: string
  username: string
  displayName: string
  email: string | null
  provider: Provider
  avatarUrl: string | null
  createdAt: number
}

export interface ProviderConfig {
  google: boolean
}

/** Usernames: 3–20 chars, lowercase letters, digits, underscore. */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/
export const isValidUsername = (u: string) => USERNAME_RE.test(u)

export type CheckResult = 'invalid' | 'available' | 'taken' | 'unknown'

/** Checks username format, then availability against the backend if present. */
export async function checkUsername(username: string): Promise<CheckResult> {
  const u = username.trim().toLowerCase()
  if (!isValidUsername(u)) return 'invalid'
  try {
    const res = await fetch(`/api/auth/username-available?u=${encodeURIComponent(u)}`)
    if (res.status === 503 || res.status === 404) return 'unknown' // no backend
    if (!res.ok) return 'unknown'
    const body = (await res.json()) as { available?: boolean }
    return body.available ? 'available' : 'taken'
  } catch {
    return 'unknown' // offline / no backend → allow demo flow
  }
}

async function fetchConfig(): Promise<ProviderConfig> {
  try {
    const res = await fetch('/api/auth/config')
    if (!res.ok) return { google: false }
    const body = (await res.json()) as { providers?: Partial<ProviderConfig> }
    return { google: Boolean(body.providers?.google) }
  } catch {
    return { google: false }
  }
}

async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/me')
    if (!res.ok) return null
    const body = (await res.json()) as { user?: AuthUser | null }
    return body.user ?? null
  } catch {
    return null
  }
}

interface AuthState {
  user: AuthUser | null // server session takes precedence; else persisted local user
  localUser: AuthUser | null // demo account when no backend
  providers: ProviderConfig | null // null = not yet loaded
  ready: boolean
  init: () => Promise<void>
  setLocalUser: (username: string, displayName?: string) => void
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      localUser: null,
      providers: null,
      ready: false,
      init: async () => {
        const [providers, serverUser] = await Promise.all([fetchConfig(), fetchMe()])
        set({ providers, user: serverUser ?? get().localUser, ready: true })
      },
      setLocalUser: (username, displayName) => {
        const u = username.trim().toLowerCase()
        const user: AuthUser = {
          id: `local-${u}`,
          username: u,
          displayName: displayName?.trim() || username.trim(),
          email: null,
          provider: 'local',
          avatarUrl: null,
          createdAt: Date.now(),
        }
        set({ localUser: user, user })
      },
      logout: async () => {
        // Local demo accounts have no server session to invalidate; only
        // server-backed sessions (google/apple) need the network round-trip.
        const current = get().user
        if (current && current.provider !== 'local') {
          try {
            await fetch('/api/auth/logout', { method: 'POST' })
          } catch {
            /* no backend */
          }
        }
        set({ user: null, localUser: null })
      },
    }),
    {
      name: 'champsnote-auth',
      // Only the demo account persists locally; server sessions live in cookies.
      partialize: (s) => ({ localUser: s.localUser }),
    },
  ),
)
