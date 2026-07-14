/**
 * Rule-based team diagnosis for Pokémon Champions — the coaching engine behind
 * the auto-analysis report. Pure functions over the loaded Pokédex/move data so
 * results are deterministic and testable.
 *
 * All meta-threat reasoning uses only the verified Champions roster
 * (species.champions === true); non-Champions Pokémon are never treated as
 * threats. Mechanics assume Champions rules (Mega on, Tera off).
 */
import { effectivenessAgainst, TYPES, type TypeName } from '@/lib/typechart'
import { statAtLevel50 } from '@/lib/champions'
import type { MoveData, Species } from '@/lib/dex'
import type { TeamMon } from '@/store/teams'

export interface ResolvedMon {
  mon: TeamMon
  species: Species
}

export type Role = 'physical' | 'special' | 'mixed' | 'wall' | 'support'

export interface TypeHole {
  type: TypeName
  weakCount: number
  resistCount: number
}

export interface MetaThreatResult {
  species: Species
  handled: boolean
  reason: 'offensive' | 'defensive' | 'none'
}

export interface CoachReport {
  memberCount: number
  weaknesses: TypeHole[] // types the team struggles against (weak ≥2, resist 0)
  resistedTypes: TypeName[] // types well covered (resist ≥2)
  offensiveCoverage: TypeName[] // types the team can hit super-effectively
  missingCoverage: TypeName[] // types nothing on the team hits super-effectively
  roles: { mon: ResolvedMon; role: Role }[]
  speed: { mon: ResolvedMon; speed: number }[]
  metaThreats: MetaThreatResult[]
  suggestions: string[]
  score: number // 0-100 heuristic overall balance score
}

const asTypes = (types: string[]) => types as TypeName[]

/** Classifies a member's battle role from stats + selected damaging moves. */
function classifyRole(mon: TeamMon, species: Species, moves: Record<string, MoveData>): Role {
  const bs = species.baseStats
  const bulk = bs.hp + bs.def + bs.spd
  const offense = Math.max(bs.atk, bs.spa)
  const moveCats = mon.moves.map((id) => moves[id]?.category).filter(Boolean)
  const hasPhys = moveCats.includes('Physical')
  const hasSpec = moveCats.includes('Special')
  const statusHeavy = moveCats.length > 0 && moveCats.every((c) => c === 'Status')

  if (statusHeavy || (bulk >= 300 && offense < 90)) return bulk >= 320 ? 'wall' : 'support'
  if (hasPhys && hasSpec) return 'mixed'
  if (hasPhys) return 'physical'
  if (hasSpec) return 'special'
  return bs.atk >= bs.spa ? 'physical' : 'special'
}

export function analyzeTeam(
  team: ResolvedMon[],
  moves: Record<string, MoveData>,
  metaRoster: Species[],
): CoachReport {
  const weaknesses: TypeHole[] = []
  const resistedTypes: TypeName[] = []

  for (const atkType of TYPES) {
    let weak = 0
    let resist = 0
    for (const { species } of team) {
      const mult = effectivenessAgainst(atkType, species.types)
      if (mult > 1) weak++
      else if (mult < 1) resist++
    }
    if (weak >= 2 && resist === 0) weaknesses.push({ type: atkType, weakCount: weak, resistCount: resist })
    if (resist >= 2) resistedTypes.push(atkType)
  }
  weaknesses.sort((a, b) => b.weakCount - a.weakCount)

  // Offensive coverage: which types the team hits super-effectively with STAB or
  // selected damaging moves.
  const attackTypes = new Set<TypeName>()
  for (const { mon, species } of team) {
    for (const t of asTypes(species.types)) attackTypes.add(t)
    for (const id of mon.moves) {
      const mv = moves[id]
      if (mv && mv.category !== 'Status' && mv.basePower > 0) attackTypes.add(mv.type as TypeName)
    }
  }
  const offensiveCoverage: TypeName[] = []
  const missingCoverage: TypeName[] = []
  for (const defType of TYPES) {
    const canHit = [...attackTypes].some((atk) => effectivenessAgainst(atk, [defType]) > 1)
    if (canHit) offensiveCoverage.push(defType)
    else missingCoverage.push(defType)
  }

  const roles = team.map(({ mon, species }) => ({
    mon: { mon, species },
    role: classifyRole(mon, species, moves),
  }))

  const speed = team
    .map(({ mon, species }) => ({
      mon: { mon, species },
      speed: statAtLevel50(species.baseStats.spe, 'spe', mon.sp.spe, mon.nature),
    }))
    .sort((a, b) => b.speed - a.speed)

  // Meta-threat coverage: for each verified Champions threat, does the team have
  // a super-effective answer (offensive) or a member resisting its STAB (defensive)?
  const metaThreats: MetaThreatResult[] = metaRoster.map((threat) => {
    const threatTypes = asTypes(threat.types)
    const offensive = [...attackTypes].some((atk) => effectivenessAgainst(atk, threat.types) > 1)
    const defensive = team.some(({ species }) =>
      threatTypes.every((tt) => effectivenessAgainst(tt, species.types) < 1),
    )
    return {
      species: threat,
      handled: offensive || defensive,
      reason: offensive ? 'offensive' : defensive ? 'defensive' : 'none',
    }
  })

  // Heuristic suggestions (Korean-agnostic keys resolved in the UI layer)
  const suggestions: string[] = []
  if (weaknesses.length > 0) {
    suggestions.push(`weakness:${weaknesses.slice(0, 3).map((w) => w.type).join(',')}`)
  }
  if (missingCoverage.length > 0) {
    suggestions.push(`coverage:${missingCoverage.slice(0, 4).join(',')}`)
  }
  const unhandled = metaThreats.filter((m) => !m.handled)
  if (unhandled.length > 0) {
    suggestions.push(`threats:${unhandled.slice(0, 3).map((m) => m.species.id).join(',')}`)
  }
  const fastCount = speed.filter((s) => s.speed >= 100).length
  if (team.length >= 4 && fastCount === 0) suggestions.push('speed:slow')
  const roleSet = new Set(roles.map((r) => r.role))
  if (team.length >= 4 && !roleSet.has('wall') && !roleSet.has('support')) suggestions.push('role:nodefense')

  // Overall balance score (heuristic, 0-100). Penalties are PROPORTIONAL so the
  // meta-threat term can't dominate: unhandled threats cost up to -30 total
  // (as a ratio of the threat list), never a flat amount per threat — otherwise
  // a large threat list would floor every team at 0.
  let score = 100
  score -= Math.min(30, weaknesses.length * 8)
  score -= Math.min(16, missingCoverage.length * 3)
  const threatRatio = metaThreats.length > 0 ? unhandled.length / metaThreats.length : 0
  score -= Math.round(threatRatio * 30)
  if (team.length < 6) score -= (6 - team.length) * 6
  score = Math.max(0, Math.min(100, Math.round(score)))

  return {
    memberCount: team.length,
    weaknesses,
    resistedTypes,
    offensiveCoverage,
    missingCoverage,
    roles,
    speed,
    metaThreats,
    suggestions,
    score,
  }
}
