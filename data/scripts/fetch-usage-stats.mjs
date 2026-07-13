/**
 * Fetches Champions usage statistics from Smogon (the source competitor sites
 * also credit) and distills them into a compact file the web app reads.
 *
 * Smogon publishes monthly "chaos" JSON for the Champions ladder format
 * (gen9championsbssregma). It is NOT reachable from the sandboxed dev proxy, so
 * the live pull runs in GitHub Actions (open internet) as part of the
 * auto-update job.
 *
 * IMPORTANT: The usage ranking on the stats page MUST always be visible. When
 * Smogon is unreachable (dev sandbox, or a month not posted yet), we no longer
 * exit without writing — instead we synthesize a fallback usage ranking from
 * the curated pokedex (competitive tier + base-stat total). The output carries
 * `fallback: true` so the UI can label the source honestly.
 *
 * Output: web/public/data/usage.json
 *   { month, format, cutoff, fallback?, pokemon: [{ id, name, usage, moves[],
 *     items[], abilities[], spreads[], teammates[] }] }  (top ~80 by usage)
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FORMAT = 'gen9championsbssregma'
const CUTOFF = 1500
const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(here, '..', '..', 'web', 'public', 'data')
const pokedexPath = path.join(outDir, 'pokedex.json')

/** Recent months to try, newest first (Smogon posts ~mid next month). */
function recentMonths(n = 4) {
  const out = []
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return out
}

async function fetchChaos() {
  for (const month of recentMonths()) {
    const url = `https://www.smogon.com/stats/${month}/chaos/${FORMAT}-${CUTOFF}.json`
    try {
      const res = await fetch(url)
      if (res.ok) return { month, json: await res.json() }
    } catch {
      /* try older month */
    }
  }
  return null
}

const toId = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')
const topEntries = (obj, n) =>
  Object.entries(obj ?? {})
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k)

/**
 * Fallback ranking when Smogon is unreachable. Derives a plausible usage order
 * from the curated pokedex: Champions-eligible species ranked by competitive
 * tier weight, then base-stat total. Usage percentages are synthetic (softmax
 * over the score) purely to draw the bars — flagged `fallback: true` so the UI
 * never presents these as measured Smogon numbers.
 */
async function buildFallback() {
  let dex
  try {
    dex = JSON.parse(await readFile(pokedexPath, 'utf8'))
  } catch {
    return null
  }
  const list = Array.isArray(dex) ? dex : dex.pokemon ?? dex.species ?? Object.values(dex)
  const TIER_WEIGHT = {
    AG: 100, Uber: 90, '(OU)': 78, OU: 75, UUBL: 66, UU: 60,
    RUBL: 52, RU: 48, NUBL: 40, NU: 36, PUBL: 30, PU: 26, ZU: 20, NFE: 10, LC: 8,
  }
  const scored = list
    .filter((s) => s && s.champions && s.tier)
    .map((s) => {
      const bst = s.baseStats
        ? Object.values(s.baseStats).reduce((a, b) => a + (Number(b) || 0), 0)
        : 0
      const tierW = TIER_WEIGHT[s.tier] ?? 15
      // Score blends competitive tier (dominant) with raw power (base-stat total).
      const score = tierW * 6 + bst
      return { id: s.id, name: s.name, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 80)

  if (scored.length === 0) return null

  // Map scores to descending, readable usage percentages (top ~35%).
  const max = scored[0].score
  const min = scored[scored.length - 1].score
  const span = Math.max(1, max - min)
  const pokemon = scored.map((s) => {
    const norm = (s.score - min) / span // 0..1
    const usage = Math.round((3 + norm * 32) * 10) / 10 // 3%..35%
    return {
      id: s.id,
      name: s.name,
      usage,
      moves: [],
      items: [],
      abilities: [],
      spreads: [],
      teammates: [],
    }
  })

  return {
    month: new Date().toISOString().slice(0, 7),
    format: FORMAT,
    cutoff: CUTOFF,
    fallback: true,
    generatedAt: new Date().toISOString(),
    pokemon,
  }
}

const result = await fetchChaos()

let out
if (result) {
  const { month, json } = result
  const data = json.data ?? {}
  const pokemon = Object.entries(data)
    .map(([name, p]) => ({
      id: toId(name),
      name,
      usage: Math.round(((p.usage ?? 0) * 1000)) / 10, // percent, 1 decimal
      moves: topEntries(p.Moves, 6).filter((m) => m && m !== ''),
      items: topEntries(p.Items, 4).filter((i) => i && i !== 'nothing'),
      abilities: topEntries(p.Abilities, 3),
      spreads: topEntries(p.Spreads, 3),
      teammates: topEntries(p.Teammates, 4).map(toId),
    }))
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 80)
  out = { month, format: FORMAT, cutoff: CUTOFF, fallback: false, generatedAt: new Date().toISOString(), pokemon }
  console.log(`Fetched Smogon ${FORMAT} ${month}: ${pokemon.length} Pokémon.`)
} else {
  console.log('Smogon usage stats not reachable; synthesizing fallback ranking from curated pokedex.')
  out = await buildFallback()
  if (!out) {
    console.error('Fallback failed: pokedex.json missing. Run `npm run build:pokedex` first.')
    process.exit(1)
  }
}

await mkdir(outDir, { recursive: true })
await writeFile(path.join(outDir, 'usage.json'), JSON.stringify(out))
console.log(
  `Wrote usage.json: ${out.pokemon.length} Pokémon (${out.fallback ? 'fallback ranking' : `Smogon ${out.month}`}).`,
)
