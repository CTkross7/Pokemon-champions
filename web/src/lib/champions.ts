/**
 * Pokemon Champions battle-system constants and the SP → engine mapping.
 *
 * Champions replaces EVs/IVs with Stat Points (SP): every Pokemon is Level 50,
 * may assign up to SP_TOTAL_MAX points across six stats, at most SP_PER_STAT_MAX
 * per stat, and 1 SP = +1 to the final stat at Lv50. See docs/DATA_SOURCES.md.
 *
 * @smogon/calc computes stats from base + IV + EV + nature + level through the
 * constructor only (post-construction stat writes are ignored). We therefore
 * model a Champions Pokemon as: perfect-IV (31) baseline at Lv50, with SP mapped
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

/** Positive / negative stat per nature (null = neutral). Used for stat math. */
export const NATURE_EFFECTS: Record<string, { plus?: StatKey; minus?: StatKey }> = {
  Serious: {},
  Adamant: { plus: 'atk', minus: 'spa' },
  Modest: { plus: 'spa', minus: 'atk' },
  Jolly: { plus: 'spe', minus: 'spa' },
  Timid: { plus: 'spe', minus: 'atk' },
  Bold: { plus: 'def', minus: 'atk' },
  Calm: { plus: 'spd', minus: 'atk' },
  Impish: { plus: 'def', minus: 'spa' },
  Careful: { plus: 'spd', minus: 'spa' },
  Brave: { plus: 'atk', minus: 'spe' },
  Quiet: { plus: 'spa', minus: 'spe' },
}

/**
 * Champions final stat at Level 50: perfect-IV (31) baseline + SP, with the
 * nature multiplier applied (non-HP only). Mirrors the engine mapping so the
 * speed-tier view matches the calculator. HP uses the standard HP formula.
 */
export function statAtLevel50(base: number, key: StatKey, sp: number, nature: string): number {
  const iv = 31
  const ev = Math.min(252, sp * 8)
  if (key === 'hp') {
    if (base === 1) return 1 // Shedinja
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * CHAMPIONS_LEVEL) / 100) + CHAMPIONS_LEVEL + 10
  }
  const raw = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * CHAMPIONS_LEVEL) / 100) + 5
  const eff = NATURE_EFFECTS[nature] ?? {}
  if (eff.plus === key) return Math.floor(raw * 1.1)
  if (eff.minus === key) return Math.floor(raw * 0.9)
  return raw
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

/** Official Korean nature names (game text). */
export const NATURE_KO: Record<Nature, string> = {
  Serious: '성실',
  Adamant: '고집',
  Modest: '조심',
  Jolly: '명랑',
  Timid: '겁쟁이',
  Bold: '대담',
  Calm: '차분',
  Impish: '장난꾸러기',
  Careful: '신중',
  Brave: '용감',
  Quiet: '냉정',
}

/** Localized nature label with the +/- stat hint, e.g. "고집 (공격↑특공↓)". */
export function natureLabel(nature: Nature, lang: string): string {
  const base = lang === 'ko' ? (NATURE_KO[nature] ?? nature) : nature
  const eff = NATURE_EFFECTS[nature]
  if (!eff?.plus || !eff?.minus) return base
  if (lang === 'ko') {
    const st = (k: StatKey) => ({ hp: 'HP', atk: '공격', def: '방어', spa: '특공', spd: '특방', spe: '스피드' })[k]
    return `${base} (${st(eff.plus)}↑${st(eff.minus)}↓)`
  }
  return base
}

export const WEATHERS = ['', 'Sun', 'Rain', 'Sand', 'Snow'] as const
export type Weather = (typeof WEATHERS)[number]

export const TERRAINS = ['', 'Electric', 'Grassy', 'Psychic', 'Misty'] as const
export type Terrain = (typeof TERRAINS)[number]

// Held items now come from the generated Champions-legal dataset
// (web/public/data/items.json via lib/items.ts) — see fetch-champions-items.mjs.
