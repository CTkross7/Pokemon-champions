/**
 * Import/export teams in a Pokemon Showdown-style paste, adapted for Champions.
 *
 * The EVs line carries Champions SP values directly (0–32 per stat), which is
 * how Champions communities share spreads, rather than raw 0–252 EVs. Import
 * clamps SP to the Champions caps and resolves names via the loaded Pokedex.
 */
import { emptySp, type Nature, type SpAllocation, STAT_KEYS } from '@/lib/champions'
import type { TeamMon } from '@/store/teams'
import type { MoveData, Species } from '@/lib/dex'

const STAT_LABEL: Record<string, string> = {
  hp: 'HP',
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
}
const LABEL_TO_STAT: Record<string, string> = Object.fromEntries(
  Object.entries(STAT_LABEL).map(([k, v]) => [v.toLowerCase(), k]),
)

export interface ExportCtx {
  speciesById: Map<string, Species>
  moves: Record<string, MoveData>
}

export interface ImportCtx {
  speciesByName: Map<string, Species> // key = normalized english/korean
  moveByName: Map<string, string> // normalized name -> move id
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')

export function exportMon(mon: TeamMon, ctx: ExportCtx): string {
  const species = ctx.speciesById.get(mon.speciesId)
  if (!species) return ''
  const lines: string[] = []
  lines.push(mon.item ? `${species.name} @ ${mon.item}` : species.name)
  if (mon.ability) lines.push(`Ability: ${mon.ability}`)
  lines.push('Level: 50')
  const sp = STAT_KEYS.filter((k) => mon.sp[k] > 0).map((k) => `${mon.sp[k]} ${STAT_LABEL[k]}`)
  if (sp.length) lines.push(`SP: ${sp.join(' / ')}`)
  if (mon.nature && mon.nature !== 'Serious') lines.push(`${mon.nature} Nature`)
  for (const id of mon.moves) {
    const move = ctx.moves[id]
    if (move) lines.push(`- ${move.name}`)
  }
  return lines.join('\n')
}

export function exportTeam(mons: (TeamMon | null)[], ctx: ExportCtx): string {
  return mons
    .filter((m): m is TeamMon => m !== null)
    .map((m) => exportMon(m, ctx))
    .join('\n\n')
}

/** Parses a paste into TeamMons. Unknown species/moves are skipped safely. */
export function importTeam(text: string, ctx: ImportCtx): TeamMon[] {
  const blocks = text
    .trim()
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
  const mons: TeamMon[] = []

  for (const block of blocks) {
    if (mons.length >= 6) break
    const lines = block.split('\n').map((l) => l.trim())
    const header = lines[0]
    if (!header) continue

    // "Species @ Item" or "Nickname (Species) @ Item"
    const [namePart, itemPart] = header.split('@').map((s) => s.trim())
    let speciesName = namePart
    const paren = namePart.match(/\(([^)]+)\)\s*$/)
    if (paren) speciesName = paren[1].trim()
    const species = ctx.speciesByName.get(norm(speciesName))
    if (!species) continue

    const sp: SpAllocation = emptySp()
    let ability = ''
    let nature: Nature = 'Serious'
    const item = itemPart ?? ''
    const moves: string[] = []

    for (const line of lines.slice(1)) {
      if (line.startsWith('Ability:')) ability = line.slice(8).trim()
      else if (line.startsWith('SP:') || line.startsWith('EVs:')) {
        const body = line.slice(line.indexOf(':') + 1)
        for (const part of body.split('/')) {
          const m = part.trim().match(/^(\d+)\s+(\w+)$/)
          if (m) {
            const stat = LABEL_TO_STAT[m[2].toLowerCase()]
            if (stat) sp[stat as keyof SpAllocation] = Math.max(0, Math.min(32, Number(m[1])))
          }
        }
      } else if (/\sNature$/.test(line)) {
        nature = line.replace(/\s+Nature$/, '').trim() as Nature
      } else if (line.startsWith('-')) {
        const moveName = line.slice(1).trim().split('/')[0].trim()
        const id = ctx.moveByName.get(norm(moveName))
        if (id && moves.length < 4) moves.push(id)
      }
    }

    mons.push({ speciesId: species.id, ability, item, nature, sp, moves })
  }
  return mons
}
