/**
 * Live matchup analysis for Pokemon Champions — the engine behind the in-battle
 * assistant. Given my team and the opponent's revealed Pokemon, it ranks threats,
 * recommends leads, and flags per-opponent answers using type matchups only, so
 * results are instant (no per-move calculation). Champions rules: Tera off.
 */
import { effectivenessAgainst, type TypeName } from '@/lib/typechart'
import type { Species } from '@/lib/dex'

const asTypes = (t: string[]) => t as TypeName[]

/** Offensive types available to a mon = its STAB types (fast heuristic). */
function offenseTypes(mon: Species): TypeName[] {
  return asTypes(mon.types)
}

/** How strongly `attacker` pressures `defender` by best STAB multiplier. */
export function bestMultiplier(attacker: Species, defender: Species): number {
  return Math.max(...offenseTypes(attacker).map((t) => effectivenessAgainst(t, defender.types)))
}

export interface LeadRec {
  mon: Species
  offense: number // # opponents hit super-effectively
  defense: number // # opponents whose STAB this mon resists
  score: number
}

export interface ThreatRank {
  mon: Species
  pressures: number // # of my team it hits super-effectively
  score: number
}

export interface OpponentAnswer {
  opponent: Species
  answers: { mon: Species; kind: 'offensive' | 'defensive' | 'both' }[]
  uncovered: boolean
}

export interface MatchupReport {
  leads: LeadRec[]
  threats: ThreatRank[]
  answers: OpponentAnswer[]
}

function resists(defender: Species, attacker: Species): boolean {
  // Defender resists all of attacker's STAB types
  return offenseTypes(attacker).every((t) => effectivenessAgainst(t, defender.types) < 1)
}
function hitsSuper(attacker: Species, defender: Species): boolean {
  return bestMultiplier(attacker, defender) > 1
}

export function analyzeMatchup(myTeam: Species[], opponents: Species[]): MatchupReport {
  const leads: LeadRec[] = myTeam.map((mon) => {
    const offense = opponents.filter((opp) => hitsSuper(mon, opp)).length
    const defense = opponents.filter((opp) => resists(mon, opp)).length
    return { mon, offense, defense, score: offense * 2 + defense }
  })
  leads.sort((a, b) => b.score - a.score || b.offense - a.offense)

  const threats: ThreatRank[] = opponents.map((opp) => {
    const pressures = myTeam.filter((mine) => hitsSuper(opp, mine) && !resists(mine, opp)).length
    return { mon: opp, pressures, score: pressures }
  })
  threats.sort((a, b) => b.score - a.score)

  const answers: OpponentAnswer[] = opponents.map((opp) => {
    const list = myTeam
      .map((mine) => {
        const off = hitsSuper(mine, opp)
        const def = resists(mine, opp)
        if (!off && !def) return null
        return { mon: mine, kind: off && def ? 'both' : off ? 'offensive' : 'defensive' } as const
      })
      .filter((x): x is { mon: Species; kind: 'offensive' | 'defensive' | 'both' } => x !== null)
      // best answers first: both > offensive > defensive
      .sort((a, b) => rank(b.kind) - rank(a.kind))
    return { opponent: opp, answers: list, uncovered: list.length === 0 }
  })

  return { leads, threats, answers }
}

function rank(kind: 'offensive' | 'defensive' | 'both'): number {
  return kind === 'both' ? 2 : kind === 'offensive' ? 1 : 0
}
