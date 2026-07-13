/**
 * Auth client + store. Talks to the Worker auth backend (`/api/auth/*`,
 * Cloudflare Worker/Pages + D1). Accounts are real: sign-in is via Google
 * (proper login/signup). There is no on-device demo account — community
 * features require being signed in. The last resolved user is cached locally
 * for instant UI; the server session cookie is the source of truth, and
 * `init()` reconciles with `/api/auth/me` on load.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Provider = 'google'

export interface AuthUser {
  id: string
  username: string
  displayName: string
  email: string | null
  provider: Provider
  avatarUrl: string | null
  createdAt: number
  isAdmin?: boolean
}

export interface ProviderConfig {
  google: boolean
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

/** Kicks off Google sign-in (proper login/signup) via the backend redirect. */
export const startGoogleLogin = () => {
  window.location.href = '/api/auth/google/start'
}
