/**
 * Recommended-move filter for the team builder.
 *
 * Champions restricts moves with a GLOBAL allow-list (the ~502 usable moves),
 * not a per-species list — so a Pokemon's selectable set is every main-game
 * move it can learn that is in that list, which is often 40-90 moves. All of
 * those are legally selectable in-game, but dumping the raw list (with niche
 * picks like Round, Snore, Attract) buries the moves that actually matter.
 *
 * This computes a focused "recommended" subset — real meta usage + STAB +
 * high-value utility + top coverage — for the DEFAULT view. Nothing is deleted:
 * the picker's "show all" toggle still exposes the full verified-legal pool,
 * and search always spans it. So we never hide a legal move or invent one.
 */
import type { MoveData, Species } from '@/lib/dex'

/** Competitive support / status moves worth surfacing when a Pokemon has them. */
const UTILITY_MOVES = new Set<string>([
  // Protection
  'protect', 'detect', 'kingsshield', 'spikyshield', 'banefulbunker', 'burningbulwark', 'silktrap',
  'wideguard', 'quickguard', 'craftyshield',
  // Doubles staples
  'fakeout', 'followme', 'ragepowder', 'helpinghand', 'coaching', 'decorate', 'pollenpuff', 'beatup',
  'partingshot', 'uturn', 'voltswitch', 'flipturn', 'batonpass', 'teleport',
  // Setup
  'swordsdance', 'nastyplot', 'dragondance', 'calmmind', 'bulkup', 'irondefense', 'agility',
  'shellsmash', 'quiverdance', 'workup', 'howl', 'victorydance', 'tidyup', 'curse', 'bellydrum',
  'takeheart', 'clangoroussoul', 'filletaway',
  // Status / disruption
  'willowisp', 'thunderwave', 'taunt', 'encore', 'disable', 'yawn', 'glare', 'spore', 'sleeppowder',
  'stunspore', 'toxic', 'nuzzle', 'lightscreen', 'reflect', 'auroraveil', 'icywind', 'electroweb',
  'snarl', 'trickroom', 'tailwind', 'safeguard', 'mist', 'imprison', 'trick', 'switcheroo',
  // Hazards / control
  'spikes', 'stealthrock', 'toxicspikes', 'stickyweb', 'rapidspin', 'defog', 'mortalspin', 'leechseed',
  // Recovery
  'recover', 'roost', 'morningsun', 'moonlight', 'synthesis', 'slackoff', 'softboiled', 'milkdrink',
  'wish', 'painsplit', 'rest', 'healbell', 'aromatherapy', 'healingwish', 'lunardance', 'junglehealing',
  'lifedew', 'healpulse', 'strengthsap',
  // Misc high-value
  'knockoff', 'endeavor', 'painsplit', 'destinybond', 'perishsong', 'haze', 'clearsmog', 'whirlwind',
  'roar', 'dragontail', 'circlethrow', 'grassyterrain', 'mistyterrain', 'electricterrain',
  'psychicterrain', 'sunnyday', 'raindance', 'sandstorm', 'snowscape', 'chillyreception',
])

export interface MoveEntry {
  id: string
  move: MoveData
}

/** Default view stays tight (~this many) so the meaningful picks aren't buried. */
const MAX_RECOMMENDED = 18

/**
 * The recommended default set of move ids for a species. `usageMoveIds` are the
 * moves this Pokemon is actually run with in the current Champions meta (from
 * usage stats) — the strongest signal; empty for off-meta Pokemon, which then
 * rely on the STAB / utility / coverage heuristics below.
 *
 * Moves are ranked by relevance and the set is capped to keep the default view
 * focused; the picker's "show all" toggle still exposes every legal move, so
 * nothing legal is ever permanently hidden.
 */
export function recommendedMoveIds(
  species: Species,
  options: MoveEntry[],
  usageMoveIds: Set<string>,
): Set<string> {
  const myTypes = new Set<string>(species.types)

  // Lower rank = more relevant. Ties broken by base power (stronger first).
  const rank = ({ id, move }: MoveEntry): number => {
    if (usageMoveIds.has(id)) return 0 // real meta usage
    if (move.basePower > 0 && myTypes.has(move.type)) return 1 // STAB damaging
    if (UTILITY_MOVES.has(id)) return 2 // high-value utility / status
    if (move.basePower >= 75 && !myTypes.has(move.type)) return 3 // strong coverage
    return 9 // everything else (niche) — only via "show all"
  }

  const ranked = options
    .map((o) => ({ o, r: rank(o) }))
    .filter((x) => x.r < 9)
    .sort((a, b) => a.r - b.r || b.o.move.basePower - a.o.move.basePower)

  return new Set(ranked.slice(0, MAX_RECOMMENDED).map((x) => x.o.id))
}
