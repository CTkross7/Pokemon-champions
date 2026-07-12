/**
 * Downloads self-hosted Pokémon sprites into web/public/sprites/{speciesId}.png.
 *
 * Source: PokéAPI sprites repo (raw.githubusercontent.com/PokeAPI/sprites),
 * 96x96 front sprites keyed by PokéAPI pokemon id. Alternate formes are
 * resolved via pokemon.csv identifiers with a best-effort match; anything
 * unresolved falls back to the base species sprite so every dex entry has art.
 *
 * Idempotent: existing files are skipped. Run after build:pokedex.
 */
import { mkdir, readFile, writeFile, access, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')
const webPublic = path.join(root, '..', 'web', 'public')
const outDir = path.join(webPublic, 'sprites')

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
const CSV_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon.csv'

const exists = (p) => access(p).then(() => true, () => false)

const { species } = JSON.parse(await readFile(path.join(webPublic, 'data', 'pokedex.json'), 'utf8'))

// identifier -> pokeapi pokemon id
const csv = await (await fetch(CSV_URL)).text()
const idByIdentifier = new Map()
for (const line of csv.split('\n').slice(1)) {
  const [id, identifier] = line.split(',')
  if (id && identifier) idByIdentifier.set(identifier, id)
}

/** Candidate PokéAPI identifiers for a Showdown species name. */
function candidates(s) {
  const base = s.name
    .toLowerCase()
    .replace(/[.'’:%]/g, '')
    .replace(/\s+/g, '-')
  const list = [base]
  // Common PokéAPI suffix conventions for formes
  for (const suffix of ['-breed', '-mode', '-form', '-standard']) list.push(base + suffix)
  // Gendered default formes (e.g. basculegion, indeedee, meowstic)
  if (!s.forme) list.push(`${base}-male`, `${base}-standard`)
  return list
}

async function download(url, dest) {
  const res = await fetch(url)
  if (!res.ok) return false
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 100) return false
  await writeFile(dest, buf)
  return true
}

await mkdir(outDir, { recursive: true })

let downloaded = 0
let fallbacks = 0
let skipped = 0
const missing = []

// Limit concurrency to be polite to the CDN
const queue = [...species]
async function worker() {
  while (queue.length > 0) {
    const s = queue.shift()
    const dest = path.join(outDir, `${s.id}.png`)
    if (await exists(dest)) {
      skipped++
      continue
    }
    let ok = false
    for (const identifier of candidates(s)) {
      const pokeapiId = idByIdentifier.get(identifier)
      if (!pokeapiId) continue
      ok = await download(`${SPRITE_BASE}/${pokeapiId}.png`, dest)
      if (ok) break
    }
    if (!ok) ok = await download(`${SPRITE_BASE}/${s.num}.png`, dest)
    if (ok) {
      downloaded++
    } else {
      // Fall back to the base species sprite when available
      const baseDest = s.baseSpecies ? path.join(outDir, `${s.baseSpecies}.png`) : null
      if (baseDest && (await exists(baseDest))) {
        await copyFile(baseDest, dest)
        fallbacks++
      } else {
        missing.push(s.id)
      }
    }
  }
}

// Base species first so forme fallbacks can copy from them
queue.sort((a, b) => Number(Boolean(a.forme)) - Number(Boolean(b.forme)))
await Promise.all(Array.from({ length: 8 }, worker))

console.log(`sprites: downloaded=${downloaded} fallback=${fallbacks} skipped=${skipped} missing=${missing.length}`)
if (missing.length > 0) console.log('missing:', missing.slice(0, 30).join(', '), missing.length > 30 ? '…' : '')
