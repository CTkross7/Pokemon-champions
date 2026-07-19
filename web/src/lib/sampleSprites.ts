/**
 * Resolve the Pokemon in an encoded sample so gallery/home cards can show
 * sprite previews (1 sprite for a 'mon' sample, up to 6 for a team).
 */
import { decodeTeam } from '@/lib/share'
import type { Species } from '@/lib/dex'

export function sampleSpecies(teamBlob: string | undefined, byId: Map<string, Species>): Species[] {
  if (!teamBlob) return []
  const decoded = decodeTeam(teamBlob)
  if (!decoded) return []
  const out: Species[] = []
  for (const m of decoded.mons) {
    if (!m) continue
    const s = byId.get(m.speciesId)
    if (s) out.push(s)
  }
  return out
}
