/** Battle-data helpers: Smogon usage stats (optional) + tier rankings. */
import type { Species } from '@/lib/dex'

/** A usage option (move/item/ability/spread) with its adoption percentage. */
export interface UsageOption {
  name: string
  /** Adoption share within this Pokemon's sets, percent (0–100). */
  pct: number
}
export interface UsageEntry {
  id: string
  name: string
  usage: number // percent
  moves: UsageOption[]
  items: UsageOption[]
  abilities: UsageOption[]
  spreads: UsageOption[]
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

/**
 * Backward-compat normalizer: older usage.json files stored moves/items/etc. as
 * plain string arrays (no percentages). Coerce those into UsageOption[] so the
 * UI can always assume the { name, pct } shape.
 */
function normalizeOptions(raw: unknown): UsageOption[] {
  if (!Array.isArray(raw)) return []
  return raw.map((v) =>
    typeof v === 'string' ? { name: v, pct: 0 } : { name: (v as UsageOption).name, pct: (v as UsageOption).pct ?? 0 },
  )
}

/** Loads Smogon usage stats if the pipeline has generated them (else null). */
export async function loadUsage(): Promise<UsageData | null> {
  try {
    const res = await fetch('/data/usage.json')
    if (!res.ok) return null
    const data = (await res.json()) as UsageData
    data.pokemon = (data.pokemon ?? []).map((p) => ({
      ...p,
      moves: normalizeOptions(p.moves),
      items: normalizeOptions(p.items),
      abilities: normalizeOptions(p.abilities),
      spreads: normalizeOptions(p.spreads),
    }))
    return data
  } catch {
    return null
  }
}

/** Korean translation tables for the Battle Data page (items/abilities/natures). */
export interface Translations {
  items: Record<string, string>
  abilities: Record<string, string>
  natures: Record<string, string>
}

let translationsPromise: Promise<Translations> | null = null
/** Loads Korean translation tables; resolves to empty maps if unavailable. */
export function loadTranslations(): Promise<Translations> {
  translationsPromise ??= fetch('/data/translations.json')
    .then((res) => (res.ok ? (res.json() as Promise<Translations>) : { items: {}, abilities: {}, natures: {} }))
    .catch(() => ({ items: {}, abilities: {}, natures: {} }))
  return translationsPromise
}

const normalizeId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Champions-specific names missing from the base PokeAPI-derived tables. The
 * Champions-exclusive Mega stones follow the official Korean mega-stone pattern
 * ("{species}나이트", e.g. 한카리아스나이트); the moves/items use their official
 * Korean names. Kept in code so a data auto-refresh can't drop them.
 */
const CHAMPIONS_ITEM_KO: Record<string, string> = {
  fairyfeather: '페어리의깃털',
  floettite: '플라엣테나이트',
  starminite: '아쿠스타나이트',
  delphoxite: '마폭시나이트',
  dragoninite: '망나뇽나이트',
  meganiumite: '메가니움나이트',
  glimmoranite: '킬라플로르나이트',
  clefablite: '픽시나이트',
  greninjite: '개굴닌자나이트',
  scovillainite: '스코빌런나이트',
  skarmorite: '무장조나이트',
  froslassite: '눈여아나이트',
}
const CHAMPIONS_MOVE_KO: Record<string, string> = {
  kingsshield: '킹실드',
  lightofruin: '멸망의빛',
}

/** Korean item name (falls back to the raw name when untranslated). */
export const itemKo = (t: Translations, name: string) =>
  t.items[normalizeId(name)] ?? CHAMPIONS_ITEM_KO[normalizeId(name)] ?? name
/** Korean ability name (falls back to the raw name when untranslated). */
export const abilityKo = (t: Translations, name: string) => t.abilities[normalizeId(name)] ?? name

/** Korean move name from the moves table, with Champions-specific fallbacks. */
export const moveKo = (moves: Record<string, { ko?: string; name?: string }> | null, name: string, ko: boolean) => {
  const id = normalizeId(name)
  const entry = moves?.[id]
  if (ko && entry?.ko) return entry.ko
  if (ko && CHAMPIONS_MOVE_KO[id]) return CHAMPIONS_MOVE_KO[id]
  return entry?.name ?? CHAMPIONS_MOVE_KO[id] ?? name
}

/**
 * Localizes a Smogon spread string. Spreads look like "Jolly:2/32/0/0/0/32"
 * (nature + BSS-style stat allocation). We translate the leading nature to
 * Korean and keep the numeric allocation as-is.
 */
export function spreadKo(t: Translations, spread: string): string {
  const [nature, ...rest] = spread.split(':')
  const ko = t.natures[normalizeId(nature)] ?? nature
  return rest.length ? `${ko}:${rest.join(':')}` : ko
}

/**
 * Resolves a usage entry to a renderable species. Champions-exclusive Megas
 * (e.g. `meganiummega`, `floettemega`) aren't in the base Pokedex, so we fall
 * back to the base species' sprite/name and tag it "Mega" — keeping the ranking
 * complete and localized instead of showing a raw English id with no sprite.
 */
export interface ResolvedMon {
  species: Species | null
  label: string
  isMega: boolean
}
export function resolveUsageMon(
  id: string,
  fallbackName: string,
  byId: Map<string, Species>,
  ko: boolean,
): ResolvedMon {
  const exact = byId.get(id)
  if (exact) return { species: exact, label: ko ? exact.ko : exact.name, isMega: Boolean(exact.forme) }
  if (id.endsWith('mega')) {
    const base = byId.get(id.slice(0, -4))
    if (base) return { species: base, label: `${ko ? base.ko : base.name} ${ko ? '메가' : 'Mega'}`, isMega: true }
  }
  return { species: null, label: fallbackName, isMega: false }
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
