import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { emptySp, type Nature, type SpAllocation } from '@/lib/champions'

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
  mons: [null, null, null, null, null, null],
  updatedAt: Date.now(),
})

interface TeamsState {
  teams: Team[]
  activeId: string | null
  createTeam: (name?: string) => string
  deleteTeam: (id: string) => void
  renameTeam: (id: string, name: string) => void
  setActive: (id: string) => void
  setMon: (teamId: string, slot: number, mon: TeamMon | null) => void
  importTeam: (team: Team) => void
}

export const useTeams = create<TeamsState>()(
  persist(
    (set, get) => ({
      teams: [],
      activeId: null,
      createTeam: (name) => {
        const team = newTeam(name || `팀 ${get().teams.length + 1}`)
        set((s) => ({ teams: [...s.teams, team], activeId: team.id }))
        return team.id
      },
      deleteTeam: (id) =>
        set((s) => {
          const teams = s.teams.filter((t) => t.id !== id)
          return { teams, activeId: s.activeId === id ? (teams[0]?.id ?? null) : s.activeId }
        }),
      renameTeam: (id, name) =>
        set((s) => ({
          teams: s.teams.map((t) => (t.id === id ? { ...t, name, updatedAt: Date.now() } : t)),
        })),
      setActive: (id) => set({ activeId: id }),
      setMon: (teamId, slot, mon) =>
        set((s) => ({
          teams: s.teams.map((t) =>
            t.id === teamId
              ? { ...t, mons: t.mons.map((m, i) => (i === slot ? mon : m)), updatedAt: Date.now() }
              : t,
          ),
        })),
      importTeam: (team) => set((s) => ({ teams: [...s.teams, team], activeId: team.id })),
    }),
    { name: 'champsnote-teams' },
  ),
)
