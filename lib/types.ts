// ===== Revt BIM model types & .revt file schema =====

export type Vec2 = { x: number; y: number }

export type Material = {
  id: string
  name: string
  color: string // hex
  density: number // kg/m3
  costPerM3: number // currency per m3
}

export type WallType = {
  id: string
  name: string
  thickness: number // m
  material: string // Material id
}

export type DoorType = {
  id: string
  name: string
  width: number // m
  height: number // m
}

export type WindowType = {
  id: string
  name: string
  width: number
  height: number
  sill: number // height from floor (m)
}

export type Level = {
  id: string
  name: string
  elevation: number // m above datum
  height: number // floor-to-floor (m)
}

export type WallElement = {
  id: string
  kind: 'wall'
  levelId: string
  a: Vec2
  b: Vec2
  height: number
  thickness: number
  material: string
}

export type SlabElement = {
  id: string
  kind: 'slab'
  levelId: string
  origin: Vec2
  width: number // along X
  depth: number // along Y
  thickness: number
  material: string
}

export type ColumnElement = {
  id: string
  kind: 'column'
  levelId: string
  at: Vec2
  width: number
  depth: number
  height: number
  material: string
}

export type OpeningElement = {
  id: string
  kind: 'door' | 'window'
  levelId: string
  hostId: string // wall id
  t: number // 0..1 along host wall
  width: number
  height: number
  sill: number // 0 for doors
}

export type Element =
  | WallElement
  | SlabElement
  | ColumnElement
  | OpeningElement

export type RevtProject = {
  schema: 'revt'
  version: number
  name: string
  units: 'm'
  createdAt: string
  updatedAt: string
  levels: Level[]
  elements: Element[]
  materials: Material[]
}

export type LibraryCatalog = {
  materials: Material[]
  wallTypes: WallType[]
  doorTypes: DoorType[]
  windowTypes: WindowType[]
}

export type BoqLine = {
  category: string
  item: string
  quantity: number
  unit: string
  detail?: string
}

export type BoqResult = {
  lines: BoqLine[]
  totals: {
    wallArea: number
    wallVolume: number
    slabArea: number
    slabVolume: number
    columnVolume: number
    concreteVolume: number
    totalWeight: number // kg
    estimatedCost: number
    currency: string
  }
  byMaterial: Array<{ material: string; volume: number; weight: number; cost: number }>
  counts: { walls: number; slabs: number; columns: number; doors: number; windows: number; levels: number }
}
