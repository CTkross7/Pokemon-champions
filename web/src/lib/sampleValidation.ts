/**
 * Completeness rules for publishing a sample. A sample must be a *finished*
 * build so the gallery stays useful: every Pokemon needs an ability, a held
 * item, all 4 moves, and its SP distributed — and a team must fill all 6 slots
 * (no empty spaces). The publish buttons gate on these.
 */
import { spTotal } from '@/lib/champions'
import type { Team, TeamMon } from '@/store/teams'

/** Total SP a finished build must spend (Champions: 66 across all stats). */
export const REQUIRED_SP = 66

/** Which required fields a single mon is missing. Empty ⇒ complete. */
export function monMissing(mon: TeamMon | null): string[] {
  if (!mon || !mon.speciesId) return ['species', 'ability', 'item', 'moves', 'sp']
  const miss: string[] = []
  if (!mon.ability) miss.push('ability')
  if (!mon.item) miss.push('item')
  // Exactly 4 DISTINCT moves — a Set drops duplicates, so dupes fail the count.
  if (new Set(mon.moves.filter((m) => !!m)).size !== 4) miss.push('moves')
  // SP must be fully distributed — exactly 66, no more, no less.
  if (spTotal(mon.sp) !== REQUIRED_SP) miss.push('sp')
  return miss
}

export const isMonComplete = (mon: TeamMon | null): boolean => monMissing(mon).length === 0

export interface SlotIssue {
  slot: number // 0-based
  missing: string[]
}

/** Per-slot issues for a team; empty array ⇒ all 6 slots complete. */
export function teamIssues(team: Pick<Team, 'mons'>): SlotIssue[] {
  const issues: SlotIssue[] = []
  team.mons.forEach((mon, slot) => {
    const missing = monMissing(mon)
    if (missing.length) issues.push({ slot, missing })
  })
  return issues
}
