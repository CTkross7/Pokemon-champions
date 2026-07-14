/**
 * Rule-based build recommendations for a single Pokemon (Champions SP system).
 * Deterministic heuristics over base stats + learnset — a starting point players
 * can tweak, not a claim of "the" optimal set. Reason keys are resolved in the UI.
 */
import { SP_PER_STAT_MAX, SP_TOTAL_MAX, emptySp, type Nature, type SpAllocation } from '@/lib/champions'
import { effectivenessAgainst, TYPES, type TypeName } from '@/lib/typechart'
import type { MoveData, Species } from '@/lib/dex'

export interface BuildRec {
  roleKey: string // i18n key suffix, e.g. 'physical'
  nature: Nature
  item: string
  sp: SpAllocation
  moves: string[] // move ids
  reasonKey: string
}

/** Max out two stats (32 each = 64) and put the remaining 2 into a third. */
function spread(a: keyof SpAllocation, b: keyof SpAllocation, c: keyof SpAllocation): SpAllocation {
  const sp = emptySp()
  sp[a] = SP_PER_STAT_MAX
  sp[b] = SP_PER_STAT_MAX
  sp[c] = SP_TOTAL_MAX - SP_PER_STAT_MAX * 2 // 2
  return sp
}

/** Picks up to 4 moves: best STAB(s) first, then best-coverage damaging moves. */
function pickMoves(
  species: Species,
  learnset: string[],
  moves: Record<string, MoveData>,
  category: 'Physical' | 'Special',
): string[] {
  const pool = learnset
    .map((id) => ({ id, m: moves[id] }))
    .filter((x) => x.m && x.m.category === category && x.m.basePower > 0)

  const stabTypes = new Set(species.types)
  const chosen: string[] = []
  const usedTypes = new Set<TypeName>()

  // 1) Best STAB moves (one per STAB type)
  for (const type of species.types) {
    const best = pool
      .filter((x) => x.m.type === type && !chosen.includes(x.id))
      .sort((a, b) => b.m.basePower - a.m.basePower)[0]
    if (best) {
      chosen.push(best.id)
      usedTypes.add(type as TypeName)
    }
  }

  // 2) Coverage: types that hit the most other types super-effectively
  const coverageRank = TYPES.filter((t) => !usedTypes.has(t))
    .map((t) => ({
      t,
      score: TYPES.filter((d) => effectivenessAgainst(t, [d]) > 1).length,
    }))
    .sort((a, b) => b.score - a.score)

  for (const { t } of coverageRank) {
    if (chosen.length >= 4) break
    const best = pool
      .filter((x) => x.m.type === t && !chosen.includes(x.id))
      .sort((a, b) => b.m.basePower - a.m.basePower)[0]
    if (best) {
      chosen.push(best.id)
      usedTypes.add(t)
    }
  }

  // 3) Fill from remaining strongest moves
  for (const x of pool.sort((a, b) => b.m.basePower - a.m.basePower)) {
    if (chosen.length >= 4) break
    if (!chosen.includes(x.id)) chosen.push(x.id)
  }

  // Nudge toward keeping at least one STAB even if pool was thin
  void stabTypes
  return chosen.slice(0, 4)
}

export function recommendBuilds(
  species: Species,
  learnset: string[],
  moves: Record<string, MoveData>,
): BuildRec[] {
  const bs = species.baseStats
  const builds: BuildRec[] = []
  const bulk = bs.hp + bs.def + bs.spd
  const fast = bs.spe >= 90

  // Primary offensive build based on the higher attacking stat.
  if (bs.atk >= bs.spa) {
    builds.push({
      roleKey: 'physical',
      nature: fast ? 'Jolly' : 'Adamant',
      // Muscle Band, not Choice Band — Choice Band/Specs are Past in Champions.
      item: bs.atk >= 110 ? 'Life Orb' : 'Muscle Band',
      sp: spread('atk', 'spe', 'hp'),
      moves: pickMoves(species, learnset, moves, 'Physical'),
      reasonKey: fast ? 'fastPhysical' : 'physical',
    })
  } else {
    builds.push({
      roleKey: 'special',
      nature: fast ? 'Timid' : 'Modest',
      item: bs.spa >= 110 ? 'Life Orb' : 'Wise Glasses',
      sp: spread('spa', 'spe', 'hp'),
      moves: pickMoves(species, learnset, moves, 'Special'),
      reasonKey: fast ? 'fastSpecial' : 'special',
    })
  }

  // Secondary bulky build for naturally bulky Pokemon.
  if (bulk >= 280) {
    const defensiveCat = bs.atk >= bs.spa ? 'Physical' : 'Special'
    builds.push({
      roleKey: 'bulky',
      nature: bs.def >= bs.spd ? 'Impish' : 'Careful',
      item: 'Leftovers',
      sp: spread('hp', bs.def >= bs.spd ? 'def' : 'spd', bs.atk >= bs.spa ? 'atk' : 'spa'),
      moves: pickMoves(species, learnset, moves, defensiveCat),
      reasonKey: 'bulky',
    })
  }

  return builds
}
