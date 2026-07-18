import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { emptySp, type Nature, type SpAllocation } from '@/lib/champions'
import { fetchCloudTeams, pushCloudTeams } from '@/lib/teamsCloud'

export interface TeamMon {
  speciesId: string
  ability: string
  item: string
  nature: Nature
  sp: SpAllocation
  moves: string[] // move ids, up to 4
}

export interface Team {
  id: string
  name: string
  description?: string // author's note / party intro, shown in gallery
  mons: (TeamMon | null)[] // exactly 6 slots
  updatedAt: number
}

export const emptyMon = (speciesId: string): TeamMon => ({
  speciesId,
  ability: '',
  item: '',
  nature: 'Serious',
  sp: emptySp(),
  moves: [],
})

const newTeam = (name: string): Team => ({
  id: crypto.randomUUID(),
  name,
  description: '',
  mons: [null, null, null, null, null, null],
  updatedAt: Date.now(),
})

interface TeamsState {
  teams: Team[]
  activeId: string | null
  cloudSynced: boolean
  /** Ids deleted locally — kept so a cloud sync can't resurrect them. */
  deletedIds: string[]
  createTeam: (name?: string) => string
  deleteTeam: (id: string) => void
  renameTeam: (id: string, name: string) => void
  setDescription: (id: string, description: string) => void
  setActive: (id: string) => void
  setMon: (teamId: string, slot: number, mon: TeamMon | null) => void
  importTeam: (team: Team) => void
  /** Merge cloud-saved teams (per user) with local ones, then push the union. */
  syncFromCloud: () => Promise<void>
}

// Debounced push so rapid slider/move edits collapse into one save. Sends teams
// AND deletion tombstones so deletes propagate across devices.
let pushTimer: ReturnType<typeof setTimeout> | null = null
function scheduleCloudPush(getState: () => TeamsState) {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    const s = getState()
    void pushCloudTeams(s.teams, s.deletedIds)
  }, 1200)
}

/**
 * Immediately flush any pending debounced cloud save. Called right before an
 * app-update reload so in-flight edits aren't lost when the tab reloads.
 * Returns a promise that resolves once the save request settles.
 */
export async function flushCloudPush(): Promise<void> {
  if (!pushTimer) return
  clearTimeout(pushTimer)
  pushTimer = null
  const s = useTeams.getState()
  await pushCloudTeams(s.teams, s.deletedIds)
}

export const useTeams = create<TeamsState>()(
  persist(
    (set, get) => {
      // Wrap a mutation so every change also schedules a cloud save.
      const mutate = (fn: (s: TeamsState) => Partial<TeamsState>) => {
        set(fn)
        scheduleCloudPush(get)
      }
      return {
        teams: [],
        activeId: null,
        cloudSynced: false,
        deletedIds: [],
        createTeam: (name) => {
          const team = newTeam(name || `팀 ${get().teams.length + 1}`)
          mutate((s) => ({ teams: [...s.teams, team], activeId: team.id }))
          return team.id
        },
        deleteTeam: (id) =>
          mutate((s) => {
            const teams = s.teams.filter((t) => t.id !== id)
            return {
              teams,
              activeId: s.activeId === id ? (teams[0]?.id ?? null) : s.activeId,
              // Tombstone the id so syncFromCloud can't bring it back.
              deletedIds: s.deletedIds.includes(id) ? s.deletedIds : [...s.deletedIds, id],
            }
          }),
        renameTeam: (id, name) =>
          mutate((s) => ({
            teams: s.teams.map((t) => (t.id === id ? { ...t, name, updatedAt: Date.now() } : t)),
          })),
        setDescription: (id, description) =>
          mutate((s) => ({
            teams: s.teams.map((t) => (t.id === id ? { ...t, description, updatedAt: Date.now() } : t)),
          })),
        setActive: (id) => set({ activeId: id }),
        setMon: (teamId, slot, mon) =>
          mutate((s) => ({
            teams: s.teams.map((t) =>
              t.id === teamId
                ? { ...t, mons: t.mons.map((m, i) => (i === slot ? mon : m)), updatedAt: Date.now() }
                : t,
            ),
          })),
        importTeam: (team) => mutate((s) => ({ teams: [...s.teams, team], activeId: team.id })),
        syncFromCloud: async () => {
          const cloud = await fetchCloudTeams()
          if (cloud === null) return // not signed in / no backend — keep local
          set((s) => {
            // Tombstones are shared across devices (stored in the cloud), so a
            // delete on ANY device is honoured everywhere. Union local + cloud.
            const deleted = new Set<string>([...s.deletedIds, ...cloud.deletedIds])
            const byId = new Map<string, Team>()
            // Start from local teams but DROP any that were deleted (locally or
            // on another device) — this is what stops a deleted team from being
            // re-uploaded and "coming back".
            for (const t of s.teams) if (!deleted.has(t.id)) byId.set(t.id, t)
            // Merge cloud teams; newer updatedAt wins, deleted ids skipped.
            for (const t of cloud.teams) {
              if (deleted.has(t.id)) continue
              const local = byId.get(t.id)
              if (!local || (t.updatedAt ?? 0) >= (local.updatedAt ?? 0)) byId.set(t.id, t)
            }
            const teams = [...byId.values()].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
            // Keep the merged tombstone list (bounded — UUIDs never recur).
            const deletedIds = [...deleted].slice(-500)
            const activeId = teams.some((t) => t.id === s.activeId) ? s.activeId : (teams[0]?.id ?? null)
            return { teams, activeId, cloudSynced: true, deletedIds }
          })
          // Push the converged state (teams + tombstones) so every device agrees.
          const s = get()
          void pushCloudTeams(s.teams, s.deletedIds)
        },
      }
    },
    { name: 'champsnote-teams' },
  ),
)
