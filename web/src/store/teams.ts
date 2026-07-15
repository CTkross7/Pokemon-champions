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

// Debounced push so rapid slider/move edits collapse into one save.
let pushTimer: ReturnType<typeof setTimeout> | null = null
function scheduleCloudPush(getTeams: () => Team[]) {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    void pushCloudTeams(getTeams())
  }, 1200)
}

export const useTeams = create<TeamsState>()(
  persist(
    (set, get) => {
      // Wrap a mutation so every change also schedules a cloud save.
      const mutate = (fn: (s: TeamsState) => Partial<TeamsState>) => {
        set(fn)
        scheduleCloudPush(() => get().teams)
      }
      return {
        teams: [],
        activeId: null,
        cloudSynced: false,
        createTeam: (name) => {
          const team = newTeam(name || `팀 ${get().teams.length + 1}`)
          mutate((s) => ({ teams: [...s.teams, team], activeId: team.id }))
          return team.id
        },
        deleteTeam: (id) =>
          mutate((s) => {
            const teams = s.teams.filter((t) => t.id !== id)
            return { teams, activeId: s.activeId === id ? (teams[0]?.id ?? null) : s.activeId }
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
            // Union by id; the newer updatedAt wins on conflicts.
            const byId = new Map<string, Team>()
            for (const t of s.teams) byId.set(t.id, t)
            for (const t of cloud) {
              const local = byId.get(t.id)
              if (!local || (t.updatedAt ?? 0) >= (local.updatedAt ?? 0)) byId.set(t.id, t)
            }
            const teams = [...byId.values()].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
            return { teams, activeId: s.activeId ?? teams[0]?.id ?? null, cloudSynced: true }
          })
          // Push the merged set so the cloud gets any local-only teams.
          void pushCloudTeams(get().teams)
        },
      }
    },
    { name: 'champsnote-teams' },
  ),
)
