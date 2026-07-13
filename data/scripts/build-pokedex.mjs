/**
 * Generates the static Pokédex dataset consumed by the web app.
 *
 * Sources:
 *  - Mechanics (species, stats, types, abilities, moves, learnsets): @pkmn/dex
 *    (Pokémon Showdown data, community-verified battle-simulator dataset)
 *  - Korean names: data/generated/ko-names.json (run fetch:ko-names first)
 *
 * Outputs (into web/public/data/):
 *  - pokedex.json      all species incl. forms (megas, regional forms)
 *  - moves.json        all moves with Korean names and battle data
 *  - learnsets.json    speciesId -> array of move ids (union across generations,
 *                      since Champions imports Pokémon from every game via HOME)
 *  - translations.json Korean names for items / abilities / natures, keyed by
 *                      normalized id. Consumed by the Battle Data (usage) page
 *                      so items, abilities and spread natures render in Korean.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Dex } from '@pkmn/dex'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')
const outDir = path.join(root, '..', 'web', 'public', 'data')

const koNames = JSON.parse(await readFile(path.join(root, 'generated', 'ko-names.json'), 'utf8'))

// Authoritative Champions roster from the Showdown `champions` mod
// (data/scripts/fetch-champions-roster.mjs). Falls back to the curated seed if
// the generated file is missing (e.g. first run before fetch).
let championsRoster
try {
  championsRoster = JSON.parse(await readFile(path.join(root, 'generated', 'champions-roster.json'), 'utf8'))
} catch {
  const seed = JSON.parse(await readFile(path.join(root, 'curated', 'roster.seed.json'), 'utf8'))
  championsRoster = { species: seed.species.map((n) => Dex.species.get(n).id), tiers: {} }
  console.warn('champions-roster.json missing; falling back to roster.seed.json')
}

const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Korean ability name. Handles form-suffixed abilities like "As One (Glastrier)"
 * whose base ("As One" = 혼연일체) is translated but the suffixed variant isn't:
 * translate the base and re-append the suffix.
 */
function abilityKo(name) {
  const direct = koNames.abilities[normalize(name)]
  if (direct) return direct
  const m = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
  if (m) {
    const base = koNames.abilities[normalize(m[1])]
    if (base) return `${base} (${m[2]})`
  }
  return name
}

/** Korean labels for forme fragments (exact forme value, lowercased). */
const FORME_KO = {
  mega: '메가',
  'mega-x': '메가 X',
  'mega-y': '메가 Y',
  alola: '알로라',
  galar: '가라르',
  hisui: '히스이',
  paldea: '팔데아',
  'paldea-aqua': '팔데아 아쿠아종',
  'paldea-blaze': '팔데아 블레이즈종',
  'paldea-combat': '팔데아 콤배트종',
  therian: '영물폼',
  incarnate: '화신폼',
  origin: '오리진폼',
  primal: '원시회귀',
  gmax: '거다이맥스',
  eternal: '영원의꽃',
  // Rotom appliance formes
  heat: '히트',
  wash: '워시',
  frost: '프로스트',
  fan: '스핀',
  mow: '커팅',
  // Lycanroc
  midnight: '한밤중의모습',
  dusk: '황혼의모습',
  midday: '한낮의모습',
  // Pumpkaboo / Gourgeist sizes
  small: '작은 사이즈',
  large: '큰 사이즈',
  super: '특대 사이즈',
  // Female-form species (Meowstic, Indeedee, Basculegion, …)
  f: '암컷',
  female: '암컷',
  male: '수컷',
}

function koFormeName(baseKo, forme) {
  if (!forme) return baseKo
  const key = forme.toLowerCase()
  // Exact match first (covers compound formes like "Paldea-Aqua").
  if (FORME_KO[key]) return `${baseKo} (${FORME_KO[key]})`
  // Otherwise translate the prefix and keep any remainder.
  for (const [frag, ko] of Object.entries(FORME_KO)) {
    if (key.startsWith(`${frag}-`)) return `${baseKo} (${ko} ${forme.slice(frag.length + 1)})`
  }
  return `${baseKo} (${forme})`
}

const EXCLUDED_NONSTANDARD = new Set(['CAP', 'Custom', 'Future'])
const rosterIds = new Set(championsRoster.species)
const championsTiers = championsRoster.tiers ?? {}

const species = []
for (const s of Dex.species.all()) {
  if (s.isNonstandard && EXCLUDED_NONSTANDARD.has(s.isNonstandard)) continue
  if (s.num <= 0) continue // missingno / pokestar
  const baseNum = s.baseSpecies ? Dex.species.get(s.baseSpecies).num : s.num
  const baseKo = koNames.species[String(baseNum)]
  if (!baseKo) continue
  species.push({
    id: s.id,
    num: s.num,
    name: s.name,
    ko: koFormeName(baseKo, s.forme),
    types: s.types,
    baseStats: s.baseStats,
    abilities: Object.values(s.abilities).map((a) => ({ name: a, ko: abilityKo(a) })),
    forme: s.forme || null,
    baseSpecies: s.baseSpecies && s.baseSpecies !== s.name ? Dex.species.get(s.baseSpecies).id : null,
    champions: rosterIds.has(s.id),
    tier: championsTiers[s.id] ?? null,
  })
}
species.sort((a, b) => a.num - b.num || a.id.localeCompare(b.id))

const moves = {}
for (const m of Dex.moves.all()) {
  // Exclude every non-standard move (Gigantamax, Past/Hidden Power, LGPE, CAP,
  // ...). None exist in Champions, and they lack Korean names — the source of
  // English move names leaking into the Korean learnset table.
  if (m.isNonstandard) continue
  moves[m.id] = {
    name: m.name,
    ko: koNames.moves[normalize(m.name)] ?? m.name,
    type: m.type,
    category: m.category,
    basePower: m.basePower,
    accuracy: m.accuracy === true ? null : m.accuracy,
    pp: m.pp,
  }
}

const learnsets = {}
for (const s of species) {
  // Fall back through base species chain (formes often share base learnsets)
  let target = s.id
  let data = (await Dex.learnsets.get(target))?.learnset
  if (!data && s.baseSpecies) data = (await Dex.learnsets.get(s.baseSpecies))?.learnset
  if (!data) continue
  learnsets[s.id] = Object.keys(data).filter((moveId) => moves[moveId])
}

await mkdir(outDir, { recursive: true })
const write = async (file, obj) => {
  const p = path.join(outDir, file)
  await writeFile(p, JSON.stringify(obj))
  const kb = ((await readFile(p)).length / 1024).toFixed(0)
  console.log(`  ${file}: ${kb} KB`)
}

// Korean translation tables for the Battle Data (usage) page. Items, abilities
// and natures come straight from the PokéAPI-derived ko-names map, re-keyed by
// the normalized id the usage pipeline emits (lowercase, alphanumeric only).
const reKey = (obj) => {
  const out = {}
  for (const [name, ko] of Object.entries(obj ?? {})) out[normalize(name)] = ko
  return out
}
const translations = {
  items: reKey(koNames.items),
  abilities: reKey(koNames.abilities),
  natures: reKey(koNames.natures),
}

console.log(`Writing datasets to ${outDir}`)
await write('pokedex.json', { generatedAt: new Date().toISOString(), species })
await write('moves.json', moves)
await write('learnsets.json', learnsets)
await write('translations.json', translations)
console.log(
  `species=${species.length} moves=${Object.keys(moves).length} learnsets=${Object.keys(learnsets).length} ` +
    `items=${Object.keys(translations.items).length} abilities=${Object.keys(translations.abilities).length} natures=${Object.keys(translations.natures).length}`,
)
