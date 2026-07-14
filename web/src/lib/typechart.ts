/**
 * Gen 9 type effectiveness chart (unchanged since Gen 6, used by Pokemon
 * Champions which shares mainline battle mechanics).
 * Source: mainline games / Pokemon Showdown data — see docs/DATA_SOURCES.md.
 */

export const TYPES = [
  'Normal',
  'Fire',
  'Water',
  'Electric',
  'Grass',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
] as const

export type TypeName = (typeof TYPES)[number]

export const TYPE_KO: Record<TypeName, string> = {
  Normal: '노말',
  Fire: '불꽃',
  Water: '물',
  Electric: '전기',
  Grass: '풀',
  Ice: '얼음',
  Fighting: '격투',
  Poison: '독',
  Ground: '땅',
  Flying: '비행',
  Psychic: '에스퍼',
  Bug: '벌레',
  Rock: '바위',
  Ghost: '고스트',
  Dragon: '드래곤',
  Dark: '악',
  Steel: '강철',
  Fairy: '페어리',
}

export const TYPE_COLORS: Record<TypeName, string> = {
  Normal: '#9a9a7c',
  Fire: '#ee8130',
  Water: '#6390f0',
  Electric: '#f0c320',
  Grass: '#7ac74c',
  Ice: '#74c6c2',
  Fighting: '#c22e28',
  Poison: '#a33ea1',
  Ground: '#dbb054',
  Flying: '#a98ff3',
  Psychic: '#f95587',
  Bug: '#a6b91a',
  Rock: '#b6a136',
  Ghost: '#735797',
  Dragon: '#6f35fc',
  Dark: '#5c493d',
  Steel: '#9999c1',
  Fairy: '#d685ad',
}

/** Non-neutral matchups: EFFECTIVENESS[attacker][defender] (missing = 1). */
const CHART: Partial<Record<TypeName, Partial<Record<TypeName, number>>>> = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: {
    Fire: 0.5,
    Water: 2,
    Grass: 0.5,
    Poison: 0.5,
    Ground: 2,
    Flying: 0.5,
    Bug: 0.5,
    Rock: 2,
    Dragon: 0.5,
    Steel: 0.5,
  },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: {
    Normal: 2,
    Ice: 2,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 0.5,
    Bug: 0.5,
    Rock: 2,
    Ghost: 0,
    Dark: 2,
    Steel: 2,
    Fairy: 0.5,
  },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: {
    Fire: 0.5,
    Grass: 2,
    Fighting: 0.5,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 2,
    Ghost: 0.5,
    Dark: 2,
    Steel: 0.5,
    Fairy: 0.5,
  },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
}

/** Damage multiplier of one attacking type against one defending type. */
export function effectiveness(attacker: TypeName, defender: TypeName): number {
  return CHART[attacker]?.[defender] ?? 1
}

/** Combined multiplier of an attacking type against a (mono/dual) type combo. */
export function effectivenessAgainst(attacker: TypeName, defenders: readonly string[]): number {
  return defenders.reduce((acc, d) => acc * effectiveness(attacker, d as TypeName), 1)
}

export interface DefensiveProfile {
  x4: TypeName[]
  x2: TypeName[]
  x05: TypeName[]
  x025: TypeName[]
  x0: TypeName[]
}

/** Groups all attacking types by their multiplier against the given combo. */
export function defensiveProfile(defenders: readonly string[]): DefensiveProfile {
  const profile: DefensiveProfile = { x4: [], x2: [], x05: [], x025: [], x0: [] }
  for (const attacker of TYPES) {
    const mult = effectivenessAgainst(attacker, defenders)
    if (mult === 0) profile.x0.push(attacker)
    else if (mult >= 4) profile.x4.push(attacker)
    else if (mult === 2) profile.x2.push(attacker)
    else if (mult === 0.5) profile.x05.push(attacker)
    else if (mult <= 0.25 && mult > 0) profile.x025.push(attacker)
  }
  return profile
}
