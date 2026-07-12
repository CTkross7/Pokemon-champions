/**
 * Data integrity checks. Fails (exit 1) if:
 *  - a curated roster species doesn't resolve in @pkmn/dex (Gen 9)
 *  - a roster species has no Korean name mapping
 *  - regulation.json violates basic schema/constraint expectations
 *  - ko-names.json spot checks fail (language column mix-up guard)
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Dex } from '@pkmn/dex'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')

const errors = []
const check = (cond, msg) => {
  if (!cond) errors.push(msg)
}

const readJson = async (rel) => JSON.parse(await readFile(path.join(root, rel), 'utf8'))

const gen9 = Dex.forGen(9)

// --- ko-names.json ---
const koNames = await readJson('generated/ko-names.json')
check(koNames.species['25'] === '피카츄', `species #25 should be 피카츄, got ${koNames.species['25']}`)
check(koNames.species['1'] === '이상해씨', `species #1 should be 이상해씨, got ${koNames.species['1']}`)
check(koNames.moves['thunderbolt'] === '10만볼트', `move thunderbolt should be 10만볼트, got ${koNames.moves['thunderbolt']}`)
check(koNames.types['water'] === '물', `type water should be 물, got ${koNames.types['water']}`)
check(Object.keys(koNames.species).length >= 1000, 'species ko-name map suspiciously small')
check(Object.keys(koNames.moves).length >= 800, 'move ko-name map suspiciously small')
check(Object.keys(koNames.abilities).length >= 250, 'ability ko-name map suspiciously small')

// --- roster.seed.json ---
const roster = await readJson('curated/roster.seed.json')
check(Array.isArray(roster.species) && roster.species.length > 0, 'roster.species must be a non-empty array')
for (const name of roster.species) {
  const species = gen9.species.get(name)
  if (!species?.exists) {
    errors.push(`roster species not found in @pkmn/dex gen9: ${name}`)
    continue
  }
  const ko = koNames.species[String(species.baseSpecies ? gen9.species.get(species.baseSpecies).num : species.num)]
  if (!ko) errors.push(`no Korean name for roster species: ${name} (#${species.num})`)
}

// --- regulation.json ---
const regulation = await readJson('curated/regulation.json')
check(regulation.battleSystem.level === 50, 'battleSystem.level must be 50')
check(regulation.battleSystem.spTotalMax === 66, 'battleSystem.spTotalMax must be 66')
check(regulation.battleSystem.spPerStatMax === 32, 'battleSystem.spPerStatMax must be 32')
check(
  regulation.battleSystem.spPerStatMax <= regulation.battleSystem.spTotalMax,
  'spPerStatMax must not exceed spTotalMax',
)
for (const [key, section] of Object.entries(regulation)) {
  if (typeof section === 'object' && section !== null && !key.startsWith('$')) {
    check(
      ['official', 'cross-checked'].includes(section.verified),
      `regulation section "${key}" must be verified as official or cross-checked (got: ${section.verified})`,
    )
  }
}

if (errors.length > 0) {
  console.error(`✗ Data validation failed with ${errors.length} error(s):`)
  for (const err of errors) console.error(`  - ${err}`)
  process.exit(1)
}
console.log(`✓ Data validation passed (${roster.species.length} roster species, ${Object.keys(koNames.species).length} ko species names)`)

// --- pokedex dataset (generated into web/public/data) ---
const webData = path.join(root, '..', 'web', 'public')
try {
  const { species: dex } = JSON.parse(await readFile(path.join(webData, 'data', 'pokedex.json'), 'utf8'))
  const byId = new Map(dex.map((s) => [s.id, s]))
  const pika = byId.get('pikachu')
  check(pika?.ko === '피카츄' && pika?.types.includes('Electric'), 'pokedex: pikachu entry broken')
  check(byId.has('charizardmegax'), 'pokedex: mega formes missing')
  check(byId.get('taurospaldeaaqua')?.champions === true, 'pokedex: champions flag missing on roster species')
  check(dex.length >= 1300, `pokedex: suspiciously few species (${dex.length})`)
  const { readdir } = await import('node:fs/promises')
  const sprites = new Set(await readdir(path.join(webData, 'sprites')))
  const noSprite = dex.filter((s) => !sprites.has(`${s.id}.png`))
  check(noSprite.length === 0, `pokedex: ${noSprite.length} species missing sprites (${noSprite.slice(0, 5).map((s) => s.id).join(', ')})`)
} catch (err) {
  errors.push(`pokedex dataset unreadable: ${err.message}`)
}

if (errors.length > 0) {
  console.error(`✗ Pokedex validation failed with ${errors.length} error(s):`)
  for (const err of errors) console.error(`  - ${err}`)
  process.exit(1)
}
console.log('✓ Pokedex dataset validation passed')

// --- COMMON_ITEMS Korean names vs authoritative PokéAPI ko-names ---
// Guards the hand-curated item list in web/src/lib/champions.ts. Newer Gen 9
// items absent from the CSV snapshot are allow-listed with verified names.
const ITEM_KO_EXCEPTIONS = { 'Booster Energy': '부스트에너지', 'Clear Amulet': '클리어참' }
try {
  const champSrc = await readFile(path.join(webData, '..', 'src', 'lib', 'champions.ts'), 'utf8')
  const itemRe = /\{ id: '([^']+)', ko: '([^']+)' \}/g
  let m
  const normI = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  while ((m = itemRe.exec(champSrc)) !== null) {
    const [, id, ko] = m
    if (id === '') continue
    const official = koNames.items[normI(id)] ?? ITEM_KO_EXCEPTIONS[id]
    check(official === ko, `item ko-name mismatch: ${id} = "${ko}" but official is "${official ?? 'unknown'}"`)
  }
} catch (err) {
  errors.push(`item ko-name check failed: ${err.message}`)
}

// --- Famous species / move Korean name spot checks ---
const spotSpecies = { 445: '한카리아스', 6: '리자몽', 150: '뮤츠', 448: '루카리오', 149: '망나뇽' }
for (const [num, ko] of Object.entries(spotSpecies)) {
  check(koNames.species[num] === ko, `species #${num} ko-name: expected ${ko}, got ${koNames.species[num]}`)
}
const spotMoves = { earthquake: '지진', surf: '파도타기', flamethrower: '화염방사', closecombat: '인파이트', dracometeor: '용성군' }
for (const [id, ko] of Object.entries(spotMoves)) {
  check(koNames.moves[id] === ko, `move ${id} ko-name: expected ${ko}, got ${koNames.moves[id]}`)
}

if (errors.length > 0) {
  console.error(`✗ Name verification failed with ${errors.length} error(s):`)
  for (const err of errors) console.error(`  - ${err}`)
  process.exit(1)
}
console.log('✓ Name verification passed (items, species, moves)')
