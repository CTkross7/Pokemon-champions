/**
 * Thin adapter over @smogon/calc that speaks the Champions SP model.
 * Keeps all engine specifics in one place so UI code stays declarative.
 */
import { calculate, Generations, Pokemon, Move, Field } from '@smogon/calc'
import type { StatsTable } from '@smogon/calc'
import {
  CHAMPIONS_LEVEL,
  spToEvs,
  type Nature,
  type SpAllocation,
  type Weather,
  type Terrain,
} from '@/lib/champions'

const gen = Generations.get(9)

export interface MonInput {
  /** @smogon/calc species name, e.g. "Garchomp" or "Charizard-Mega-Y". */
  species: string
  ability?: string
  item?: string
  nature: Nature
  sp: SpAllocation
  teraType?: string
  teraActive?: boolean
}

export interface FieldInput {
  weather: Weather
  terrain: Terrain
}

export interface CalcResult {
  minPercent: number
  maxPercent: number
  minDamage: number
  maxDamage: number
  koChance: string
  desc: string
  defenderHp: number
}

function buildPokemon(input: MonInput): Pokemon {
  return new Pokemon(gen, input.species, {
    level: CHAMPIONS_LEVEL,
    ability: input.ability || undefined,
    item: input.item || undefined,
    nature: input.nature,
    evs: spToEvs(input.sp) as Partial<StatsTable>,
    teraType: input.teraActive && input.teraType ? (input.teraType as never) : undefined,
  })
}

const toId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Whether @smogon/calc recognizes a species name (guards free-text input). */
export function speciesExists(name: string): boolean {
  return Boolean(gen.species.get(toId(name) as never))
}

export function listAbilities(species: string): string[] {
  const s = gen.species.get(toId(species) as never)
  if (!s) return []
  return [...new Set(Object.values(s.abilities ?? {}))].filter(Boolean) as string[]
}

/**
 * Runs a single attacker→defender move calculation.
 * Returns null when inputs are incomplete/invalid rather than throwing.
 */
export function calcDamage(
  attacker: MonInput,
  defender: MonInput,
  moveName: string,
  field: FieldInput,
): CalcResult | null {
  if (!speciesExists(attacker.species) || !speciesExists(defender.species) || !moveName) return null
  try {
    const atk = buildPokemon(attacker)
    const def = buildPokemon(defender)
    const move = new Move(gen, moveName)
    const f = new Field({
      weather: field.weather || undefined,
      terrain: field.terrain || undefined,
    })
    const result = calculate(gen, atk, def, move, f)

    const damage = result.damage
    const rolls = Array.isArray(damage) ? damage : [damage]
    const flat = rolls.flat() as number[]
    if (flat.length === 0 || flat.every((d) => d === 0)) {
      return {
        minPercent: 0,
        maxPercent: 0,
        minDamage: 0,
        maxDamage: 0,
        koChance: '',
        desc: result.desc(),
        defenderHp: def.maxHP(),
      }
    }
    const min = Math.min(...flat)
    const max = Math.max(...flat)
    const hp = def.maxHP()
    let koChance = ''
    try {
      koChance = result.kochance().text ?? ''
    } catch {
      /* engine can throw on some edge combos; omit KO text */
    }
    return {
      minDamage: min,
      maxDamage: max,
      minPercent: Math.round((min / hp) * 1000) / 10,
      maxPercent: Math.round((max / hp) * 1000) / 10,
      koChance,
      desc: result.desc(),
      defenderHp: hp,
    }
  } catch {
    return null
  }
}
