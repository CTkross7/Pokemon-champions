/**
 * Backend-free team/build sharing: encodes a team into a compact URL-safe string
 * placed in the link hash (#s=...), so shares work on static hosting with no
 * server or database. Phase 7 adds accounts + a public gallery on top of this.
 */
import { emptySp, type Nature, type SpAllocation, STAT_KEYS } from '@/lib/champions'
import type { Team, TeamMon } from '@/store/teams'

const VERSION = 1

// Compact tuple form of a mon to keep URLs short.
type PackedMon = [string, string, string, string, number[], string[]] // id, ability, item, nature, sp[6], moves

function packMon(m: TeamMon): PackedMon {
  return [m.speciesId, m.ability, m.item, m.nature, STAT_KEYS.map((k) => m.sp[k]), m.moves]
}

function unpackMon(p: PackedMon): TeamMon {
  const sp: SpAllocation = emptySp()
  STAT_KEYS.forEach((k, i) => (sp[k] = Number(p[4]?.[i]) || 0))
  return {
    speciesId: String(p[0]),
    ability: String(p[1] ?? ''),
    item: String(p[2] ?? ''),
    nature: (p[3] as Nature) || 'Serious',
    sp,
    moves: Array.isArray(p[5]) ? p[5].map(String).slice(0, 4) : [],
  }
}

function toBase64Url(s: string): string {
  const b64 = btoa(unescape(encodeURIComponent(s)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  return decodeURIComponent(escape(atob(b64)))
}

export function encodeTeam(team: Pick<Team, 'name' | 'mons'>): string {
  const payload = {
    v: VERSION,
    n: team.name,
    m: team.mons.map((m) => (m ? packMon(m) : 0)),
  }
  return toBase64Url(JSON.stringify(payload))
}

export interface DecodedTeam {
  name: string
  mons: (TeamMon | null)[]
}

export function decodeTeam(encoded: string): DecodedTeam | null {
  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as {
      v: number
      n: string
      m: (PackedMon | 0)[]
    }
    if (payload.v !== VERSION || !Array.isArray(payload.m)) return null
    const mons = [0, 1, 2, 3, 4, 5].map((i) => {
      const p = payload.m[i]
      return Array.isArray(p) ? unpackMon(p) : null
    })
    return { name: String(payload.n ?? 'Shared team'), mons }
  } catch {
    return null
  }
}

/** Full shareable URL for a team (hash-based; never sent to a server). */
export function shareUrl(team: Pick<Team, 'name' | 'mons'>): string {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  return `${base}/share#s=${encodeTeam(team)}`
}
