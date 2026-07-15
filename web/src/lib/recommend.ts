/**
 * Team-completion recommender: given the current team, suggests Champions
 * Pokemon to ADD, ranked by how well they patch the team's holes and how often
 * they're actually paired with the current members in the live meta.
 *
 * Signals (all from verified sources — the Champions roster, the type chart, and
 * real usage/teammate stats; nothing fabricated):
 *   • synergy    — appears in a current member's `teammates` usage list
 *   • weakness   — resists a type the whole team is weak to
 *   • threat     — answers a meta threat the team currently can't handle
 *   • coverage   — its STAB hits a type nothing on the team hits super-effectively
 *   • meta       — raw usage as a tiebreaker
 */
import { effectivenessAgainst, type TypeName } from '@/lib/typechart'
import type { Species } from '@/lib/dex'
import type { CoachReport } from '@/lib/coach'
import type { UsageData } from '@/lib/stats'

export interface MemberRec {
  species: Species
  score: number
  /** Primary reason, resolved in the UI. Forms:
   *  'synergy:<partnerId>:<rank>' | 'weakness' | 'threat' | 'coverage' | 'meta' */
  reasonKey: string
}

const isMega = (id: string) => /mega|gmax|primal/.test(id)

/**
 * @param teamIds   species ids already on the team (excluded from results)
 * @param report    coach analysis of the current team (weaknesses / threats)
 * @param pokedex   full dex (champions filtered inside)
 * @param usage     live usage/teammate stats (optional)
 */
export function recommendMembers(
  teamIds: string[],
  report: CoachReport | null,
  pokedex: Species[],
  usage: UsageData | null,
  limit = 10,
): MemberRec[] {
  const onTeam = new Set(teamIds)
  const usageById = new Map((usage?.pokemon ?? []).map((p) => [p.id, p]))

  // Which current members list each candidate as a common teammate, and at what
  // rank — the earlier in a partner's teammate list, the stronger the synergy.
  const synergy = new Map<string, { partner: string; rank: number }>()
  for (const memberId of teamIds) {
    const mates = usageById.get(memberId)?.teammates ?? []
    mates.forEach((mateId, i) => {
      const prev = synergy.get(mateId)
      if (!prev || i < prev.rank) synergy.set(mateId, { partner: memberId, rank: i })
    })
  }

  const weaknessTypes = (report?.weaknesses ?? []).map((w) => w.type)
  const missingCoverage = report?.missingCoverage ?? []
  const unhandled = (report?.metaThreats ?? []).filter((m) => !m.handled).map((m) => m.species)

  const candidates = pokedex.filter((s) => s.champions && !isMega(s.id) && !onTeam.has(s.id))

  const recs: MemberRec[] = candidates.map((c) => {
    const cTypes = c.types as TypeName[]
    let score = 0
    const parts: { key: string; weight: number }[] = []

    // Synergy — real co-usage. Rank 0 (top teammate) is worth most.
    const syn = synergy.get(c.id)
    if (syn) {
      const w = 30 - Math.min(24, syn.rank * 4)
      score += w
      parts.push({ key: `synergy:${syn.partner}:${syn.rank + 1}`, weight: w })
    }

    // Weakness patch — candidate resists a type the whole team folds to.
    let weakCovered = 0
    for (const wt of weaknessTypes) if (effectivenessAgainst(wt, c.types) < 1) weakCovered++
    if (weakCovered > 0) {
      const w = weakCovered * 12
      score += w
      parts.push({ key: 'weakness', weight: w })
    }

    // Threat answer — handles a meta threat the team currently can't.
    let threatCovered = 0
    for (const th of unhandled) {
      const offensive = cTypes.some((atk) => effectivenessAgainst(atk, th.types) > 1)
      const defensive = (th.types as TypeName[]).every((tt) => effectivenessAgainst(tt, c.types) < 1)
      if (offensive || defensive) threatCovered++
    }
    if (threatCovered > 0) {
      const w = Math.min(24, threatCovered * 4)
      score += w
      parts.push({ key: 'threat', weight: w })
    }

    // Coverage — its STAB fills a hole in the team's offensive coverage.
    let covers = 0
    for (const mc of missingCoverage) if (cTypes.some((atk) => effectivenessAgainst(atk, [mc]) > 1)) covers++
    if (covers > 0) {
      const w = Math.min(16, covers * 4)
      score += w
      parts.push({ key: 'coverage', weight: w })
    }

    // Meta usage — small tiebreaker so strong, popular mons float up.
    const usagePct = usageById.get(c.id)?.usage ?? 0
    score += Math.min(10, usagePct)

    // Primary reason = highest-weighted contributing signal (fallback: meta).
    parts.sort((a, b) => b.weight - a.weight)
    const reasonKey = parts[0]?.key ?? 'meta'
    return { species: c, score: Math.round(score), reasonKey }
  })

  return recs
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
