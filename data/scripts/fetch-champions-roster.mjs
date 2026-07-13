/**
 * Fetches the AUTHORITATIVE Pokémon Champions roster from Pokémon Showdown's
 * `champions` mod (data/mods/champions/formats-data.ts) — the same open-source
 * (MIT), officially-mirrored dataset that competitor sites use. This replaces
 * the hand-maintained roster seed so the dex reflects exactly what exists in
 * Champions, and auto-updates when Showdown updates the mod.
 *
 * A species is in the Champions roster when its formats-data entry has a tier
 * other than "Illegal" and is not flagged isNonstandard (Past/Future/etc).
 *
 * Output: data/generated/champions-roster.json { generatedAt, source, count,
 *   species: [showdownId...], tiers: { showdownId: tier } }
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC =
  'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/champions/formats-data.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(here, '..', 'generated')

const res = await fetch(SRC)
if (!res.ok) throw new Error(`Failed to fetch champions formats-data: HTTP ${res.status}`)
const text = await res.text()

// Parse the `id: { ... }` blocks. Entries are one level deep and brace-balanced
// per species, so a non-greedy block match is sufficient for this file.
const entryRe = /(\w+):\s*\{([^}]*)\}/g
const species = []
const tiers = {}
let m
while ((m = entryRe.exec(text)) !== null) {
  const [, id, body] = m
  const tier = body.match(/tier:\s*"([^"]+)"/)?.[1] ?? null
  const nonstandard = body.match(/isNonstandard:\s*"([^"]+)"/)?.[1] ?? null
  // Legal in Champions: has a real competitive tier and isn't a past/future mon.
  const legal = tier && tier !== 'Illegal' && !nonstandard
  if (legal) {
    species.push(id)
    tiers[id] = tier
  }
}

species.sort()

if (species.length < 100) {
  throw new Error(`Champions roster suspiciously small (${species.length}); parse likely broke`)
}

const out = {
  generatedAt: new Date().toISOString(),
  source: SRC,
  count: species.length,
  species,
  tiers,
}

await mkdir(outDir, { recursive: true })
const outPath = path.join(outDir, 'champions-roster.json')
await writeFile(outPath, JSON.stringify(out, null, 1))
console.log(`Wrote ${outPath}`)
console.log(`Champions roster: ${species.length} species (Showdown champions mod)`)
console.log(`Sample: ${species.slice(0, 12).join(', ')}`)
