import type { BoqResult, Element, Material, RevtProject } from './types'
import { dist, round2, round3 } from './geometry'

// ===== المحرك الحسابي (يُستخدم محليًا وفي المعالج السحابي) =====

function materialById(materials: Material[], id: string): Material | undefined {
  return materials.find((m) => m.id === id)
}

export function computeBoq(project: RevtProject, currency = 'SAR'): BoqResult {
  const els = project.elements
  const walls = els.filter((e) => e.kind === 'wall') as Extract<Element, { kind: 'wall' }>[]
  const slabs = els.filter((e) => e.kind === 'slab') as Extract<Element, { kind: 'slab' }>[]
  const columns = els.filter((e) => e.kind === 'column') as Extract<Element, { kind: 'column' }>[]
  const doors = els.filter((e) => e.kind === 'door') as Extract<Element, { kind: 'door' }>[]
  const windows = els.filter((e) => e.kind === 'window') as Extract<Element, { kind: 'window' }>[]

  // مساحة الفتحات على كل جدار
  const openingAreaByWall: Record<string, number> = {}
  for (const o of [...doors, ...windows]) {
    openingAreaByWall[o.hostId] = (openingAreaByWall[o.hostId] || 0) + o.width * o.height
  }

  const volByMaterial: Record<string, number> = {}
  const addVol = (matId: string, v: number) => {
    volByMaterial[matId] = (volByMaterial[matId] || 0) + v
  }

  let wallArea = 0
  let wallVolume = 0
  for (const w of walls) {
    const len = dist(w.a, w.b)
    const gross = len * w.height
    const net = Math.max(0, gross - (openingAreaByWall[w.id] || 0))
    const vol = net * w.thickness
    wallArea += net
    wallVolume += vol
    addVol(w.material, vol)
  }

  let slabArea = 0
  let slabVolume = 0
  for (const s of slabs) {
    const area = s.width * s.depth
    const vol = area * s.thickness
    slabArea += area
    slabVolume += vol
    addVol(s.material, vol)
  }

  let columnVolume = 0
  for (const c of columns) {
    const vol = c.width * c.depth * c.height
    columnVolume += vol
    addVol(c.material, vol)
  }

  let totalWeight = 0
  let estimatedCost = 0
  const byMaterial = Object.entries(volByMaterial).map(([matId, volume]) => {
    const m = materialById(project.materials, matId)
    const density = m?.density ?? 1500
    const cost = m?.costPerM3 ?? 200
    const weight = volume * density
    const lineCost = volume * cost
    totalWeight += weight
    estimatedCost += lineCost
    return {
      material: m?.name ?? matId,
      volume: round3(volume),
      weight: Math.round(weight),
      cost: Math.round(lineCost),
    }
  })

  const concreteVolume = wallVolume + slabVolume + columnVolume

  const lines: BoqResult['lines'] = [
    { category: 'جدران', item: 'مساحة الجدران (صافي)', quantity: round2(wallArea), unit: 'م²' },
    { category: 'جدران', item: 'حجم الجدران', quantity: round3(wallVolume), unit: 'م³' },
    { category: 'أرضيات', item: 'مساحة الأرضيات', quantity: round2(slabArea), unit: 'م²' },
    { category: 'أرضيات', item: 'حجم الأرضيات', quantity: round3(slabVolume), unit: 'م³' },
    { category: 'أعمدة', item: 'حجم الأعمدة', quantity: round3(columnVolume), unit: 'م³' },
    { category: 'فتحات', item: 'عدد الأبواب', quantity: doors.length, unit: 'عدد' },
    { category: 'فتحات', item: 'عدد النوافذ', quantity: windows.length, unit: 'عدد' },
  ]

  return {
    lines,
    totals: {
      wallArea: round2(wallArea),
      wallVolume: round3(wallVolume),
      slabArea: round2(slabArea),
      slabVolume: round3(slabVolume),
      columnVolume: round3(columnVolume),
      concreteVolume: round3(concreteVolume),
      totalWeight: Math.round(totalWeight),
      estimatedCost: Math.round(estimatedCost),
      currency,
    },
    byMaterial,
    counts: {
      walls: walls.length,
      slabs: slabs.length,
      columns: columns.length,
      doors: doors.length,
      windows: windows.length,
      levels: project.levels.length,
    },
  }
}
