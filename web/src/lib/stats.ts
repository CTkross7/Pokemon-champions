/** Battle-data helpers: Smogon usage stats (optional) + tier rankings. */
import type { Species } from '@/lib/dex'

export interface UsageEntry {
  id: string
  name: string
  usage: number // percent
  moves: string[]
  items: string[]
  abilities: string[]
  spreads: string[]
  teammates: string[]
}
export interface UsageData {
  month: string
  format: string
  cutoff: number
  /** True when the ranking is synthesized from curated tiers (Smogon unreachable). */
  fallback?: boolean
  pokemon: UsageEntry[]
}

/** Loads Smogon usage stats if the pipeline has generated them (else null). */
export async function loadUsage(): Promise<UsageData | null> {
  try {
    const res = await fetch('/data/usage.json')
    if (!res.ok) return null
    return (await res.json()) as UsageData
  } catch {
    return null
  }
}

/** Competitive tier order, strongest first (Smogon usage-derived tiers). */
export const TIER_ORDER = [
  'AG',
  'Uber',
  'OU',
  'UUBL',
  'UU',
  'RUBL',
  'RU',
  'NUBL',
  'NU',
  'PUBL',
  'PU',
  'ZUBL',
  'ZU',
  'NFE',
  'LC',
] as const

const tierRank = (tier: string | null) => {
  const i = TIER_ORDER.indexOf((tier ?? '') as (typeof TIER_ORDER)[number])
  return i < 0 ? TIER_ORDER.length : i
}

/** Groups Champions species by tier, strongest tier first, base formes first. */
export function groupByTier(species: Species[]): { tier: string; mons: Species[] }[] {
  const byTier = new Map<string, Species[]>()
  for (const s of species) {
    if (!s.tier) continue
    if (!byTier.has(s.tier)) byTier.set(s.tier, [])
    byTier.get(s.tier)!.push(s)
  }
  return [...byTier.entries()]
    .sort((a, b) => tierRank(a[0]) - tierRank(b[0]))
    .map(([tier, mons]) => ({
      tier,
      mons: mons.sort((a, b) => Number(Boolean(a.forme)) - Number(Boolean(b.forme)) || a.num - b.num),
    }))
}
