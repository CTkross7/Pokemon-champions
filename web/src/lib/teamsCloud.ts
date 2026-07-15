/**
 * Cloud persistence for teams (Cloudflare D1, per signed-in user). Every call
 * degrades gracefully: with no backend / not signed in it returns null and the
 * app keeps working from localStorage only.
 */
import type { Team } from '@/store/teams'

export async function fetchCloudTeams(): Promise<Team[] | null> {
  try {
    const res = await fetch('/api/data/teams')
    if (!res.ok) return null
    const body = (await res.json()) as { teams?: Team[] }
    return Array.isArray(body.teams) ? body.teams : null
  } catch {
    return null
  }
}

export async function pushCloudTeams(teams: Team[]): Promise<void> {
  try {
    await fetch('/api/data/teams', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ teams }),
    })
  } catch {
    /* offline / not signed in — localStorage still has the data */
  }
}
