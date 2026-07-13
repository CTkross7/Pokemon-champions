/**
 * Fetches Champions usage statistics from Smogon (the source competitor sites
 * also credit) and distills them into a compact file the web app reads.
 *
 * Smogon publishes monthly "chaos" JSON for the Champions ladder format
 * (gen9championsbssregma). It is NOT reachable from the sandboxed dev proxy, so
 * this runs in GitHub Actions (open internet) as part of the auto-update job.
 * If no month is reachable it exits 0 without writing, and the stats page falls
 * back to tier-based rankings — so a fetch failure never breaks the build.
 *
 * Output: web/public/data/usage.json
 *   { month, format, cutoff, pokemon: [{ id, usage, moves[], items[],
 *     abilities[], spreads[], teammates[] }] }  (top ~80 by usage)
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FORMAT = 'gen9championsbssregma'
const CUTOFF = 1500
const here = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(here, '..', '..', 'web', 'public', 'data')

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

const result = await fetchChaos()
if (!result) {
  console.log('Smogon usage stats not reachable; skipping (stats page uses tier fallback).')
  process.exit(0)
}

const { month, json } = result
const data = json.data ?? {}
const totalWeight = Object.values(data).reduce((s, p) => s + (p.usage ?? p['Raw count'] ?? 0), 0) || 1

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

void totalWeight
const out = { month, format: FORMAT, cutoff: CUTOFF, generatedAt: new Date().toISOString(), pokemon }
await mkdir(outDir, { recursive: true })
await writeFile(path.join(outDir, 'usage.json'), JSON.stringify(out))
console.log(`Wrote usage.json: ${pokemon.length} Pokémon from Smogon ${FORMAT} ${month}`)
