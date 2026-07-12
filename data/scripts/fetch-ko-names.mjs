/**
 * Generates Korean (and English) name maps from the PokéAPI CSV dataset.
 *
 * Source: https://github.com/PokeAPI/pokeapi (data/v2/csv), BSD-3 licensed data
 * derived from the core games. Korean = local_language_id 3, English = 9.
 *
 * Output: data/generated/ko-names.json
 *  - species: national dex number -> Korean species name
 *  - moves / abilities / items / types / natures: normalized English name -> Korean name
 *
 * Normalized key = English name lowercased with all non-alphanumerics removed,
 * which matches @pkmn/dex ID normalization.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv'
const KO = '3'
const EN = '9'

const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(here, '..', 'generated')

/** Minimal CSV parser with quoted-field support. */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      field = ''
      rows.push(row)
      row = []
    } else if (ch !== '\r') {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

async function fetchCsv(file) {
  const url = `${BASE}/${file}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`)
  const rows = parseCsv(await res.text())
  const header = rows.shift()
  return rows
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])))
}

const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Builds { normalizedEnglishName: koreanName } from a *_names.csv table.
 */
function buildNameMap(rows, idColumn) {
  const en = new Map()
  const ko = new Map()
  for (const row of rows) {
    if (row.local_language_id === EN) en.set(row[idColumn], row.name)
    else if (row.local_language_id === KO) ko.set(row[idColumn], row.name)
  }
  const map = {}
  for (const [id, enName] of en) {
    const koName = ko.get(id)
    if (koName) map[normalize(enName)] = koName
  }
  return map
}

async function main() {
  console.log('Fetching PokéAPI name CSVs...')
  const [species, moves, abilities, items, types, natures] = await Promise.all([
    fetchCsv('pokemon_species_names.csv'),
    fetchCsv('move_names.csv'),
    fetchCsv('ability_names.csv'),
    fetchCsv('item_names.csv'),
    fetchCsv('type_names.csv'),
    fetchCsv('nature_names.csv'),
  ])

  // Species keyed by national dex number (species id == national number).
  const speciesKo = {}
  for (const row of species) {
    if (row.local_language_id === KO) speciesKo[row.pokemon_species_id] = row.name
  }

  const out = {
    generatedAt: new Date().toISOString(),
    source: 'https://github.com/PokeAPI/pokeapi data/v2/csv',
    species: speciesKo,
    moves: buildNameMap(moves, 'move_id'),
    abilities: buildNameMap(abilities, 'ability_id'),
    items: buildNameMap(items, 'item_id'),
    types: buildNameMap(types, 'type_id'),
    natures: buildNameMap(natures, 'nature_id'),
  }

  await mkdir(outDir, { recursive: true })
  const outPath = path.join(outDir, 'ko-names.json')
  await writeFile(outPath, JSON.stringify(out, null, 1))

  console.log(`Wrote ${outPath}`)
  console.log(
    `  species=${Object.keys(out.species).length} moves=${Object.keys(out.moves).length}` +
      ` abilities=${Object.keys(out.abilities).length} items=${Object.keys(out.items).length}` +
      ` types=${Object.keys(out.types).length} natures=${Object.keys(out.natures).length}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
