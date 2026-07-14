/**
 * Fetches the AUTHORITATIVE per-Pokémon movepools for Pokémon Champions from
 * Showdown's `champions` mod (data/mods/champions/learnsets.ts) — the same
 * open-source (MIT) dataset the roster comes from. This is the exact set of
 * moves each Pokémon can actually use in Champions, so building learnsets from
 * it (instead of the general Gen 9 movepool) guarantees the app never shows a
 * move that doesn't exist in Champions, and never hides one that does.
 *
 * Output: data/generated/champions-learnsets.json
 *   { generatedAt, source, count, learnsets: { showdownId: [moveId, ...] } }
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC =
  'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/champions/learnsets.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(here, '..', 'generated')

const res = await fetch(SRC)
if (!res.ok) throw new Error(`Failed to fetch champions learnsets: HTTP ${res.status}`)
const text = await res.text()

// The file is tab-indented and well-formed:
//   \tspeciesid: {
//   \t\tlearnset: {
//   \t\t\tmoveid: ["9M", ...],
//   \t\t},
//   \t},
// Parse line-based, tracking the current species and whether we're inside its
// learnset object (depth via leading tabs), which is robust for this format.
const learnsets = {}
let current = null
let inLearnset = false
for (const raw of text.split('\n')) {
  const speciesMatch = raw.match(/^\t(\w+):\s*\{/)
  if (speciesMatch) {
    current = speciesMatch[1]
    learnsets[current] = []
    inLearnset = false
    continue
  }
  if (!current) continue
  if (/^\t\tlearnset:\s*\{/.test(raw)) {
    inLearnset = true
    continue
  }
  if (inLearnset) {
    if (/^\t\t\}/.test(raw)) {
      inLearnset = false
      continue
    }
    const moveMatch = raw.match(/^\t\t\t(\w+):/)
    if (moveMatch) learnsets[current].push(moveMatch[1])
  }
}

// Drop species that ended up with no moves (parse artifacts / event-only blocks).
for (const id of Object.keys(learnsets)) {
  if (learnsets[id].length === 0) delete learnsets[id]
}

const count = Object.keys(learnsets).length
if (count < 100) {
  throw new Error(`Champions learnsets suspiciously small (${count}); parse likely broke`)
}

const out = { generatedAt: new Date().toISOString(), source: SRC, count, learnsets }
await mkdir(outDir, { recursive: true })
const outPath = path.join(outDir, 'champions-learnsets.json')
await writeFile(outPath, JSON.stringify(out))
console.log(`Wrote ${outPath}`)
console.log(`Champions learnsets: ${count} species (Showdown champions mod)`)
const sample = Object.entries(learnsets)[0]
console.log(`Sample: ${sample[0]} → ${sample[1].length} moves (${sample[1].slice(0, 5).join(', ')}…)`)
