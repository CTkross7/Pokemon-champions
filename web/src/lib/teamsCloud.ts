/**
 * Cloud persistence for teams (Cloudflare D1, per signed-in user). Every call
 * degrades gracefully: with no backend / not signed in it returns null and the
 * app keeps working from localStorage only.
 *
 * The payload carries deletion tombstones (deletedIds) alongside the teams so a
 * delete on one device (app or web) propagates to the others — otherwise a
 * union-merge on the other device would re-upload the deleted team ("it came
 * back"). Ids are UUIDs and never recur, so tombstones are safe to accumulate.
 */
import type { Team } from '@/store/teams'

export interface CloudTeams {
  teams: Team[]
  deletedIds: string[]
}

export async function fetchCloudTeams(): Promise<CloudTeams | null> {
  try {
    const res = await fetch('/api/data/teams')
    if (!res.ok) return null
    const body = (await res.json()) as { teams?: Team[]; deletedIds?: string[] }
    if (!Array.isArray(body.teams)) return null
    return { teams: body.teams, deletedIds: Array.isArray(body.deletedIds) ? body.deletedIds : [] }
  } catch {
    return null
  }
}

export async function pushCloudTeams(teams: Team[], deletedIds: string[] = []): Promise<void> {
  try {
    await fetch('/api/data/teams', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ teams, deletedIds }),
    })
  } catch {
    /* offline / not signed in — localStorage still has the data */
  }
}
