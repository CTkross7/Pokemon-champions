/**
 * Dex search / filter state, held in a store so it survives leaving and
 * re-entering the Dex tab. The page component remounts on navigation (the
 * Layout keys <main> by pathname for its transition), which would otherwise
 * reset a locally-held query — users expect their search to still be there when
 * they come back from a detail page. Kept in-memory (not persisted): a full
 * reload starts fresh, which is the right default for a search box.
 */
import { create } from 'zustand'
import type { StatKey } from '@/lib/dex'
import type { TypeName } from '@/lib/typechart'

export type DexSortKey = 'num' | 'total' | StatKey

interface DexFilterState {
  query: string
  typeFilter: TypeName | null
  includeFormes: boolean
  sort: DexSortKey
  limit: number
  set: (patch: Partial<Omit<DexFilterState, 'set' | 'reset'>>) => void
  reset: () => void
}

const DEFAULTS = { query: '', typeFilter: null, includeFormes: true, sort: 'num' as DexSortKey, limit: 60 }

export const useDexFilters = create<DexFilterState>((set) => ({
  ...DEFAULTS,
  set: (patch) => set(patch),
  reset: () => set(DEFAULTS),
}))
