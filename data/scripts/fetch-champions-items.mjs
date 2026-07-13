/**
 * Builds the full list of held items that are LEGAL in Pokémon Champions, so
 * the team builder / calculator can offer every valid item (not a hand-picked
 * handful). Sources — the same ones the reference service credits:
 *   - Pokémon Showdown base items (data/items.ts): item set + metadata
 *   - Showdown `champions` mod items (mods/champions/items.ts): legality
 *     overrides (isNonstandard "Past" = removed, null = explicitly enabled)
 *   - Korean names from web/public/data/translations.json (PokéAPI-derived)
 *
 * A held item is included when it is a real numbered item, is not a Poké Ball
 * or Z-Crystal, is not disabled (base or champions "Past"/nonstandard), and has
 * a verified Korean name. Output: web/public/data/items.json
 *   [{ id, name, ko, cat }]  cat: mega | berry | plate | gem | item
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(here, '..', '..', 'web', 'public', 'data')
const BASE = 'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/items.ts'
const MOD = 'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/champions/items.ts'

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Splits an items.ts into { id: bodyText } blocks. */
function parseBlocks(src) {
  const blocks = {}
  const re = /^\t([a-z0-9]+):\s*\{([\s\S]*?)^\t\}/gm
  let m
  while ((m = re.exec(src))) blocks[m[1]] = m[2]
  return blocks
}

const field = (body, key) => {
  const m = new RegExp(`${key}:\\s*("?)([\\w.-]+)\\1`).exec(body)
  return m ? m[2] : undefined
}
const has = (body, key) => new RegExp(`\\b${key}:`).test(body)

const ILLEGAL_NS = new Set(['Past', 'Future', 'Unobtainable', 'CAP', 'Gigantamax', 'LGPE'])

async function main() {
  const [baseSrc, modSrc] = await Promise.all([
    fetch(BASE).then((r) => r.text()),
    fetch(MOD).then((r) => r.text()),
  ])
  const base = parseBlocks(baseSrc)
  const mod = parseBlocks(modSrc)

  let translations = { items: {} }
  try {
    translations = JSON.parse(await readFile(path.join(outDir, 'translations.json'), 'utf8'))
  } catch {
    /* names optional but strongly preferred */
  }

  // Base-species Korean names, to derive Korean for Champions-exclusive Mega
  // stones (no official PokéAPI name) via the standard "{species}나이트" pattern.
  let baseSpecies = []
  try {
    const dex = JSON.parse(await readFile(path.join(outDir, 'pokedex.json'), 'utf8'))
    baseSpecies = dex.species.filter((s) => !s.forme && s.ko)
  } catch {
    /* pokedex optional */
  }
  const EXTRA_KO = { fairyfeather: '페어리의깃털' }
  function stoneKo(id) {
    let suf = ''
    let core = id
    if (/nitex$/.test(id)) ((suf = ' X'), (core = id.slice(0, -5)))
    else if (/nitey$/.test(id)) ((suf = ' Y'), (core = id.slice(0, -5)))
    else if (/itex$/.test(id)) ((suf = ' X'), (core = id.slice(0, -4)))
    else if (/itey$/.test(id)) ((suf = ' Y'), (core = id.slice(0, -4)))
    else if (/nite$/.test(id)) core = id.slice(0, -4)
    else if (/ite$/.test(id)) core = id.slice(0, -3)
    else return null
    let best = null
    for (const s of baseSpecies) {
      if (core === s.id || core.startsWith(s.id) || s.id.startsWith(core)) {
        if (!best || Math.abs(s.id.length - core.length) < Math.abs(best.id.length - core.length)) best = s
      }
    }
    return best ? `${best.ko}나이트${suf}` : null
  }
  const koOf = (id) => translations.items?.[id] || EXTRA_KO[id] || stoneKo(id)

  const items = []
  for (const [id, body] of Object.entries(base)) {
    const num = field(body, 'num')
    if (!num || Number(num) <= 0) continue // real numbered items only
    if (has(body, 'isPokeball')) continue // Poké Balls aren't held battle items
    if (has(body, 'zMove')) continue // no Z-moves in Champions
    if (has(body, 'itemUser') && has(body, 'zMove')) continue

    // Legality: champions override wins over the base game.
    const modBody = mod[id]
    let legal
    if (modBody !== undefined) {
      const modNs = field(modBody, 'isNonstandard')
      legal = !(modNs && ILLEGAL_NS.has(modNs)) // null/absent → enabled
    } else {
      const baseNs = field(body, 'isNonstandard')
      legal = !(baseNs && ILLEGAL_NS.has(baseNs))
    }
    if (!legal) continue

    const ko = koOf(id)
    if (!ko) continue // skip items with no verified Korean name

    let cat = 'item'
    if (has(body, 'megaStone')) cat = 'mega'
    else if (has(body, 'isBerry')) cat = 'berry'
    else if (has(body, 'onPlate')) cat = 'plate'
    else if (has(body, 'isGem')) cat = 'gem'

    const name = body.match(/name:\s*"([^"]+)"/)?.[1] || id
    items.push({ id, name, ko, cat })
  }

  items.sort((a, b) => a.ko.localeCompare(b.ko, 'ko'))
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'items.json'), JSON.stringify(items))
  const byCat = items.reduce((o, i) => ((o[i.cat] = (o[i.cat] || 0) + 1), o), {})
  console.log(`Wrote items.json: ${items.length} Champions-legal held items`, byCat)
}

main().catch((e) => {
  console.error('fetch-champions-items failed:', e)
  process.exit(1)
})
