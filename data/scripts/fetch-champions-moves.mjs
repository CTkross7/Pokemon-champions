/**
 * Fetches Pokémon Champions move LEGALITY + BALANCE data from Showdown's
 * `champions` mod (data/mods/champions/moves.ts).
 *
 * The mod inherits Gen 9 and then:
 *   - marks moves `isNonstandard: "Past"`  → the move DOES NOT exist in Champions
 *   - sets `isNonstandard: null`           → re-enables a move that is Past in Gen 9
 *   - overrides basePower / pp / accuracy  → Champions-specific balance values
 *
 * So the verified "exists in Champions" move set is:
 *   (standard Gen 9 moves − banned) ∪ reenabled
 * and display/calc values must apply the overrides.
 *
 * Output: data/generated/champions-moves.json
 *   { generatedAt, source, banned: [...], reenabled: [...],
 *     modified: { moveId: { basePower?, pp?, accuracy? } } }
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC =
  'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/champions/moves.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(here, '..', 'generated')

const res = await fetch(SRC)
if (!res.ok) throw new Error(`Failed to fetch champions moves: HTTP ${res.status}`)
const text = await res.text()

// Line-based parse of the tab-indented `\tmoveid: { ... \t},` blocks. Only the
// scalar fields we consume are extracted; long desc strings are ignored.
const banned = []
const reenabled = []
const modified = {}
let current = null
let fields = {}

const flush = () => {
  if (!current) return
  if (fields.nonstandard === 'null') reenabled.push(current)
  else if (fields.nonstandard) banned.push(current)
  const mods = {}
  if (fields.basePower !== undefined) mods.basePower = fields.basePower
  if (fields.pp !== undefined) mods.pp = fields.pp
  if (fields.accuracy !== undefined) mods.accuracy = fields.accuracy
  if (Object.keys(mods).length) modified[current] = mods
  current = null
  fields = {}
}

for (const raw of text.split('\n')) {
  const start = raw.match(/^\t(\w+):\s*\{/)
  if (start) {
    flush()
    current = start[1]
    continue
  }
  if (!current) continue
  if (/^\t\},?\s*$/.test(raw)) {
    flush()
    continue
  }
  let m
  if ((m = raw.match(/^\t\tisNonstandard:\s*(null|"(\w+)")/))) fields.nonstandard = m[2] ?? 'null'
  else if ((m = raw.match(/^\t\tbasePower:\s*(\d+)/))) fields.basePower = Number(m[1])
  else if ((m = raw.match(/^\t\tpp:\s*(\d+)/))) fields.pp = Number(m[1])
  else if ((m = raw.match(/^\t\taccuracy:\s*(\d+|true)/)))
    fields.accuracy = m[1] === 'true' ? true : Number(m[1])
}
flush()

if (banned.length < 50) {
  throw new Error(`Champions banned-move list suspiciously small (${banned.length}); parse likely broke`)
}

const out = {
  generatedAt: new Date().toISOString(),
  source: SRC,
  banned: banned.sort(),
  reenabled: reenabled.sort(),
  modified,
}
await mkdir(outDir, { recursive: true })
const outPath = path.join(outDir, 'champions-moves.json')
await writeFile(outPath, JSON.stringify(out, null, 1))
console.log(`Wrote ${outPath}`)
console.log(
  `Champions moves: ${banned.length} banned, ${reenabled.length} re-enabled, ${Object.keys(modified).length} stat-modified`,
)
console.log(`Re-enabled: ${reenabled.join(', ')}`)
