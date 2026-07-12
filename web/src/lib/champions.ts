/**
 * Pokémon Champions battle-system constants and the SP → engine mapping.
 *
 * Champions replaces EVs/IVs with Stat Points (SP): every Pokémon is Level 50,
 * may assign up to SP_TOTAL_MAX points across six stats, at most SP_PER_STAT_MAX
 * per stat, and 1 SP = +1 to the final stat at Lv50. See docs/DATA_SOURCES.md.
 *
 * @smogon/calc computes stats from base + IV + EV + nature + level through the
 * constructor only (post-construction stat writes are ignored). We therefore
 * model a Champions Pokémon as: perfect-IV (31) baseline at Lv50, with SP mapped
 * to EVs at 8 EV per SP. Because floor(EV/4) * level/100 = SP at Lv50, this is
 * exact for 0–31 SP; at the 32-SP maximum the 252-EV cap yields ±1 in rare
 * base-stat parities — flagged for in-game verification in DATA_SOURCES.md.
 */
import type { StatKey } from '@/lib/dex'

export const CHAMPIONS_LEVEL = 50
export const SP_TOTAL_MAX = 66
export const SP_PER_STAT_MAX = 32

export const STAT_KEYS: StatKey[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']

export type SpAllocation = Record<StatKey, number>

export const emptySp = (): SpAllocation => ({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 })

export const spTotal = (sp: SpAllocation): number => STAT_KEYS.reduce((sum, k) => sum + (sp[k] || 0), 0)

/** Clamp a single stat's SP given the per-stat cap and remaining total budget. */
export function clampSp(sp: SpAllocation, key: StatKey, next: number): SpAllocation {
  const others = spTotal(sp) - (sp[key] || 0)
  const maxForStat = Math.min(SP_PER_STAT_MAX, SP_TOTAL_MAX - others)
  const value = Math.max(0, Math.min(maxForStat, Math.round(next)))
  return { ...sp, [key]: value }
}

/** Maps an SP allocation to the EV table @smogon/calc consumes (8 EV per SP). */
export function spToEvs(sp: SpAllocation): SpAllocation {
  const evs = emptySp()
  for (const key of STAT_KEYS) evs[key] = Math.min(252, (sp[key] || 0) * 8)
  return evs
}

/** Neutral-by-default nature list (Champions nature usage is unconfirmed). */
export const NATURES = [
  'Serious',
  'Adamant',
  'Modest',
  'Jolly',
  'Timid',
  'Bold',
  'Calm',
  'Impish',
  'Careful',
  'Brave',
  'Quiet',
] as const

export type Nature = (typeof NATURES)[number]

export const WEATHERS = ['', 'Sun', 'Rain', 'Sand', 'Snow'] as const
export type Weather = (typeof WEATHERS)[number]

export const TERRAINS = ['', 'Electric', 'Grassy', 'Psychic', 'Misty'] as const
export type Terrain = (typeof TERRAINS)[number]

/** Common competitive held items (@smogon/calc name → Korean label). */
export const COMMON_ITEMS: ReadonlyArray<{ id: string; ko: string }> = [
  { id: '', ko: '없음' },
  { id: 'Choice Band', ko: '구애머리띠' },
  { id: 'Choice Specs', ko: '구애안경' },
  { id: 'Choice Scarf', ko: '구애스카프' },
  { id: 'Life Orb', ko: '생명의구슬' },
  { id: 'Leftovers', ko: '먹다남은음식' },
  { id: 'Assault Vest', ko: '돌격조끼' },
  { id: 'Focus Sash', ko: '기합의띠' },
  { id: 'Rocky Helmet', ko: '울퉁불퉁멧' },
  { id: 'Sitrus Berry', ko: '자뭉열매' },
  { id: 'Expert Belt', ko: '달인의띠' },
  { id: 'Weakness Policy', ko: '약점보험' },
  { id: 'Booster Energy', ko: '부스트에너지' },
  { id: 'Clear Amulet', ko: '클리어참' },
  { id: 'Safety Goggles', ko: '방진고글' },
  { id: 'Mystic Water', ko: '신비의물방울' },
  { id: 'Charcoal', ko: '목탄' },
  { id: 'Magnet', ko: '자석' },
  { id: 'Miracle Seed', ko: '기적의씨' },
]
