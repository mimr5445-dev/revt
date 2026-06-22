// متجر مستقل للعناصر المعمارية — لا يمس متجر المشروع الأساسي.
import { create } from 'zustand'
import { uid } from '@/lib/geometry'
import type { Roof } from './roof'
import type { Stair } from './stairs'
import type { Dimension } from './dimensions'
import type { Space } from './spaces'

const KEY = 'revt-arch-v1'

export interface ArchData {
  roofs: Roof[]
  stairs: Stair[]
  dimensions: Dimension[]
  spaces: Space[]
}

export interface ArchState extends ArchData {
  hydrated: boolean
  hydrate: () => void
  addRoof: (r: Omit<Roof, 'id'>) => void
  updateRoof: (id: string, patch: Partial<Roof>) => void
  removeRoof: (id: string) => void
  addStair: (s: Omit<Stair, 'id'>) => void
  updateStair: (id: string, patch: Partial<Stair>) => void
  removeStair: (id: string) => void
  setDimensions: (d: Dimension[]) => void
  removeDimension: (id: string) => void
  setSpaces: (s: Space[]) => void
  renameSpace: (id: string, name: string) => void
  clearArch: () => void
}

const empty: ArchData = { roofs: [], stairs: [], dimensions: [], spaces: [] }

function load(): ArchData {
  if (typeof window === 'undefined') return empty
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) return { ...empty, ...JSON.parse(raw) }
  } catch {}
  return empty
}

function save(s: ArchData) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ roofs: s.roofs, stairs: s.stairs, dimensions: s.dimensions, spaces: s.spaces }),
    )
  } catch {}
}

type Setter = (fn: (s: ArchState) => Partial<ArchState>) => void
type Getter = () => ArchState
type UseArch = {
  <U>(selector: (s: ArchState) => U): U
  (): ArchState
}

const init = (set: Setter, get: Getter): ArchState => {
  const persist = () => save(get())
  return {
    ...empty,
    hydrated: false,
    hydrate: () => set(() => ({ ...load(), hydrated: true })),
    addRoof: (r) => {
      set((s) => ({ roofs: [...s.roofs, { ...r, id: uid('roof') }] }))
      persist()
    },
    updateRoof: (id, patch) => {
      set((s) => ({ roofs: s.roofs.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
      persist()
    },
    removeRoof: (id) => {
      set((s) => ({ roofs: s.roofs.filter((x) => x.id !== id) }))
      persist()
    },
    addStair: (st) => {
      set((s) => ({ stairs: [...s.stairs, { ...st, id: uid('stair') }] }))
      persist()
    },
    updateStair: (id, patch) => {
      set((s) => ({ stairs: s.stairs.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
      persist()
    },
    removeStair: (id) => {
      set((s) => ({ stairs: s.stairs.filter((x) => x.id !== id) }))
      persist()
    },
    setDimensions: (d) => {
      set(() => ({ dimensions: d }))
      persist()
    },
    removeDimension: (id) => {
      set((s) => ({ dimensions: s.dimensions.filter((x) => x.id !== id) }))
      persist()
    },
    setSpaces: (sp) => {
      set(() => ({ spaces: sp }))
      persist()
    },
    renameSpace: (id, name) => {
      set((s) => ({ spaces: s.spaces.map((x) => (x.id === id ? { ...x, name } : x)) }))
      persist()
    },
    clearArch: () => {
      set(() => ({ ...empty }))
      persist()
    },
  }
}

export const useArch = (create as unknown as (i: typeof init) => UseArch)(init)
