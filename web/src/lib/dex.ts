/** Runtime loader and query helpers for the static Pokédex datasets. */

export interface Ability {
  name: string
  ko: string
}

export interface Species {
  id: string
  num: number
  name: string
  ko: string
  types: string[]
  baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }
  abilities: Ability[]
  forme: string | null
  baseSpecies: string | null
  champions: boolean
  tier: string | null
}

export interface MoveData {
  name: string
  ko: string
  type: string
  category: 'Physical' | 'Special' | 'Status'
  basePower: number
  accuracy: number | null
  pp: number
}

export const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const
export type StatKey = (typeof STAT_KEYS)[number]

export const statTotal = (s: Species) => STAT_KEYS.reduce((sum, k) => sum + s.baseStats[k], 0)

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load ${path}: HTTP ${res.status}`)
  return res.json() as Promise<T>
}

let pokedexPromise: Promise<Species[]> | null = null
export function loadPokedex(): Promise<Species[]> {
  pokedexPromise ??= fetchJson<{ species: Species[] }>('/data/pokedex.json').then((d) => d.species)
  return pokedexPromise
}

let movesPromise: Promise<Record<string, MoveData>> | null = null
export function loadMoves(): Promise<Record<string, MoveData>> {
  movesPromise ??= fetchJson<Record<string, MoveData>>('/data/moves.json')
  return movesPromise
}

let learnsetsPromise: Promise<Record<string, string[]>> | null = null
export function loadLearnsets(): Promise<Record<string, string[]>> {
  learnsetsPromise ??= fetchJson<Record<string, string[]>>('/data/learnsets.json')
  return learnsetsPromise
}

const normalizeQuery = (q: string) => q.trim().toLowerCase().replace(/\s+/g, '')

/** Matches Korean or English names (substring, case/space-insensitive). */
export function matchesQuery(species: Species, rawQuery: string): boolean {
  const q = normalizeQuery(rawQuery)
  if (!q) return true
  return (
    species.ko.replace(/\s+/g, '').includes(q) ||
    species.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(q.replace(/[^a-z0-9]/g, '')) ||
    String(species.num) === q
  )
}

/** Self-hosted sprite (see data/scripts/fetch-sprites.mjs). */
export function spriteUrl(species: Species): string {
  return `/sprites/${species.id}.png`
}
