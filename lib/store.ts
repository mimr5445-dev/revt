'use client'

import { create } from 'zustand'
import type {
  ColumnElement,
  Element,
  Level,
  LibraryCatalog,
  OpeningElement,
  RevtProject,
  SlabElement,
  Vec2,
  WallElement,
} from './types'
import { createEmptyProject } from './revt-file'
import { CLOUD_LIBRARY } from './library'
import { uid } from './geometry'

export type Tool = 'select' | 'wall' | 'slab' | 'column' | 'door' | 'window' | 'pan'
export type ViewMode = 'plan' | '3d' | 'split'

const STORAGE_KEY = 'revt-project-v1'

type DraftPoint = Vec2 | null

interface State {
  project: RevtProject
  activeLevelId: string
  selectedId: string | null
  tool: Tool
  view: ViewMode
  draft: DraftPoint
  library: LibraryCatalog
  activeWallTypeId: string
  activeDoorTypeId: string
  activeWindowTypeId: string
  hydrated: boolean

  // actions
  hydrate: () => void
  persist: () => void
  newProject: () => void
  loadProject: (p: RevtProject) => void
  setProjectName: (name: string) => void
  setTool: (t: Tool) => void
  setView: (v: ViewMode) => void
  setActiveLevel: (id: string) => void
  select: (id: string | null) => void
  setDraft: (p: DraftPoint) => void
  setLibrary: (lib: LibraryCatalog) => void
  setActiveWallType: (id: string) => void
  setActiveDoorType: (id: string) => void
  setActiveWindowType: (id: string) => void

  addWall: (a: Vec2, b: Vec2) => void
  addSlab: (origin: Vec2, width: number, depth: number) => void
  addColumn: (at: Vec2) => void
  addOpening: (kind: 'door' | 'window', hostId: string, t: number) => void
  updateElement: (id: string, patch: Partial<Element>) => void
  deleteElement: (id: string) => void
  addLevel: () => void
  updateLevel: (id: string, patch: Partial<Level>) => void
  deleteLevel: (id: string) => void
}

function touch(p: RevtProject): RevtProject {
  return { ...p, updatedAt: new Date().toISOString() }
}

export const useStore = create<State>((set, get) => ({
  project: createEmptyProject(),
  activeLevelId: 'L0',
  selectedId: null,
  tool: 'select',
  view: 'plan',
  draft: null,
  library: CLOUD_LIBRARY,
  activeWallTypeId: CLOUD_LIBRARY.wallTypes[0].id,
  activeDoorTypeId: CLOUD_LIBRARY.doorTypes[0].id,
  activeWindowTypeId: CLOUD_LIBRARY.windowTypes[0].id,
  hydrated: false,

  hydrate: () => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const p = JSON.parse(raw) as RevtProject
        if (p && p.schema === 'revt') {
          set({ project: p, activeLevelId: p.levels[0]?.id ?? 'L0', hydrated: true })
          return
        }
      }
    } catch {}
    set({ hydrated: true })
  },

  persist: () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().project))
    } catch {}
  },

  newProject: () => {
    const p = createEmptyProject()
    set({ project: p, activeLevelId: p.levels[0].id, selectedId: null, draft: null })
    get().persist()
  },

  loadProject: (p) => {
    set({ project: p, activeLevelId: p.levels[0]?.id ?? 'L0', selectedId: null, draft: null })
    get().persist()
  },

  setProjectName: (name) => {
    set((s) => ({ project: touch({ ...s.project, name }) }))
    get().persist()
  },

  setTool: (t) => set({ tool: t, draft: null }),
  setView: (v) => set({ view: v }),
  setActiveLevel: (id) => set({ activeLevelId: id, selectedId: null }),
  select: (id) => set({ selectedId: id }),
  setDraft: (p) => set({ draft: p }),
  setLibrary: (lib) => set({ library: lib }),
  setActiveWallType: (id) => set({ activeWallTypeId: id }),
  setActiveDoorType: (id) => set({ activeDoorTypeId: id }),
  setActiveWindowType: (id) => set({ activeWindowTypeId: id }),

  addWall: (a, b) => {
    const s = get()
    const wt = s.library.wallTypes.find((w) => w.id === s.activeWallTypeId) ?? s.library.wallTypes[0]
    const level = s.project.levels.find((l) => l.id === s.activeLevelId)
    const wall: WallElement = {
      id: uid('wall'),
      kind: 'wall',
      levelId: s.activeLevelId,
      a,
      b,
      height: level?.height ?? 3.0,
      thickness: wt.thickness,
      material: wt.material,
    }
    set((st) => ({ project: touch({ ...st.project, elements: [...st.project.elements, wall] }), selectedId: wall.id }))
    get().persist()
  },

  addSlab: (origin, width, depth) => {
    const s = get()
    const slab: SlabElement = {
      id: uid('slab'),
      kind: 'slab',
      levelId: s.activeLevelId,
      origin,
      width: Math.abs(width),
      depth: Math.abs(depth),
      thickness: 0.2,
      material: 'concrete',
    }
    set((st) => ({ project: touch({ ...st.project, elements: [...st.project.elements, slab] }), selectedId: slab.id }))
    get().persist()
  },

  addColumn: (at) => {
    const s = get()
    const level = s.project.levels.find((l) => l.id === s.activeLevelId)
    const col: ColumnElement = {
      id: uid('col'),
      kind: 'column',
      levelId: s.activeLevelId,
      at,
      width: 0.4,
      depth: 0.4,
      height: level?.height ?? 3.0,
      material: 'concrete',
    }
    set((st) => ({ project: touch({ ...st.project, elements: [...st.project.elements, col] }), selectedId: col.id }))
    get().persist()
  },

  addOpening: (kind, hostId, t) => {
    const s = get()
    let opening: OpeningElement
    if (kind === 'door') {
      const dt = s.library.doorTypes.find((d) => d.id === s.activeDoorTypeId) ?? s.library.doorTypes[0]
      opening = { id: uid('door'), kind: 'door', levelId: s.activeLevelId, hostId, t, width: dt.width, height: dt.height, sill: 0 }
    } else {
      const wn = s.library.windowTypes.find((w) => w.id === s.activeWindowTypeId) ?? s.library.windowTypes[0]
      opening = { id: uid('win'), kind: 'window', levelId: s.activeLevelId, hostId, t, width: wn.width, height: wn.height, sill: wn.sill }
    }
    set((st) => ({ project: touch({ ...st.project, elements: [...st.project.elements, opening] }), selectedId: opening.id }))
    get().persist()
  },

  updateElement: (id, patch) => {
    set((st) => ({
      project: touch({
        ...st.project,
        elements: st.project.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as Element) : e)),
      }),
    }))
    get().persist()
  },

  deleteElement: (id) => {
    set((st) => ({
      project: touch({
        ...st.project,
        // حذف العنصر + أي فتحات مستضافة عليه
        elements: st.project.elements.filter((e) => e.id !== id && (e as OpeningElement).hostId !== id),
      }),
      selectedId: null,
    }))
    get().persist()
  },

  addLevel: () => {
    set((st) => {
      const last = st.project.levels[st.project.levels.length - 1]
      const level: Level = {
        id: uid('lvl'),
        name: 'دور ' + (st.project.levels.length + 1),
        elevation: (last?.elevation ?? 0) + (last?.height ?? 3.2),
        height: 3.2,
      }
      return { project: touch({ ...st.project, levels: [...st.project.levels, level] }) }
    })
    get().persist()
  },

  updateLevel: (id, patch) => {
    set((st) => ({
      project: touch({ ...st.project, levels: st.project.levels.map((l) => (l.id === id ? { ...l, ...patch } : l)) }),
    }))
    get().persist()
  },

  deleteLevel: (id) => {
    set((st) => {
      if (st.project.levels.length <= 1) return {} as any
      const levels = st.project.levels.filter((l) => l.id !== id)
      const elements = st.project.elements.filter((e) => e.levelId !== id)
      const activeLevelId = st.activeLevelId === id ? levels[0].id : st.activeLevelId
      return { project: touch({ ...st.project, levels, elements }), activeLevelId }
    })
    get().persist()
  },
}))
