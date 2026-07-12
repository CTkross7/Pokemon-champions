/**
 * Client for the optional community-gallery API (Cloudflare Worker + D1).
 * Every call degrades gracefully: if the backend isn't configured it returns a
 * `configured: false` result instead of throwing, so the UI can show a friendly
 * "gallery not set up yet" state while the rest of the app keeps working.
 */
export interface SampleMeta {
  id: string
  title: string
  author: string
  likes: number
  views: number
  created_at: number
}

export interface SampleFull extends SampleMeta {
  team: string // base64url-encoded team (share format)
}

type Result<T> = { configured: true; data: T } | { configured: false }

const NOT_CONFIGURED = { configured: false } as const

async function call<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const res = await fetch(`/api${path}`, init)
    if (res.status === 503) return NOT_CONFIGURED
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { configured: true, data: (await res.json()) as T }
  } catch {
    return NOT_CONFIGURED
  }
}

export const listSamples = () => call<{ samples: SampleMeta[] }>('/samples')

export const getSample = (id: string) => call<{ sample: SampleFull }>(`/samples/${id}`)

export const likeSample = (id: string) =>
  call<{ likes: number }>(`/samples/${id}/like`, { method: 'POST' })

export const createSample = (payload: { title: string; author: string; team: string }) =>
  call<{ id: string }>('/samples', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
