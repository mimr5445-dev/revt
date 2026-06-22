// أسقف بارامترية (مسطح/مائل/جملون/هرمي) فوق مستطيل أرضية.
import type { Vec2 } from '@/lib/types'

export type RoofKind = 'flat' | 'shed' | 'gable' | 'hip'

export interface Roof {
  id: string
  name: string
  origin: Vec2 // ركن (أقل x,y) لمستطيل الأرضية
  width: number // الامتداد على X
  depth: number // الامتداد على Y
  baseElevation: number // منسوب الأفاريز (م)
  kind: RoofKind
  pitch: number // درجة الميل (درجات)
  overhang: number // بروز (م)
  thickness: number // سمك (م) — للمسطح
}

export type Vert3 = [number, number, number] // x, y(up), z
export interface Mesh {
  verts: Vert3[]
  faces: number[][] // فهارس محلية 0-based
}

function tanPitch(deg: number): number {
  return Math.tan((Math.max(0, Math.min(85, deg)) * Math.PI) / 180)
}

// الأبعاد مع البروز
function footprint(roof: Roof) {
  const ox = roof.origin.x - roof.overhang
  const oz = roof.origin.y - roof.overhang
  const W = roof.width + 2 * roof.overhang
  const D = roof.depth + 2 * roof.overhang
  return { ox, oz, W, D }
}

// ارتفاع الريدج فوق الأفاريز
export function ridgeHeight(roof: Roof): number {
  const { W, D } = footprint(roof)
  const t = tanPitch(roof.pitch)
  switch (roof.kind) {
    case 'flat':
      return 0
    case 'shed':
      return W * t
    case 'gable':
    case 'hip':
      return (Math.min(W, D) / 2) * t
  }
}

export function computeRoofMesh(roof: Roof): Mesh {
  const { ox, oz, W, D } = footprint(roof)
  const b = roof.baseElevation
  const t = tanPitch(roof.pitch)
  const verts: Vert3[] = []
  const faces: number[][] = []
  const add = (v: Vert3) => verts.push(v) - 1

  if (roof.kind === 'flat') {
    const top = b + roof.thickness
    const a0 = add([ox, top, oz])
    const a1 = add([ox + W, top, oz])
    const a2 = add([ox + W, top, oz + D])
    const a3 = add([ox, top, oz + D])
    faces.push([a0, a1, a2, a3])
    return { verts, faces }
  }

  if (roof.kind === 'shed') {
    const hL = b
    const hH = b + W * t
    const a0 = add([ox, hL, oz])
    const a1 = add([ox + W, hH, oz])
    const a2 = add([ox + W, hH, oz + D])
    const a3 = add([ox, hL, oz + D])
    faces.push([a0, a1, a2, a3])
    return { verts, faces }
  }

  if (roof.kind === 'gable') {
    const rz = oz + D / 2
    const rh = b + (D / 2) * t
    const e0 = add([ox, b, oz]) // أفريز أمامي يسار
    const e1 = add([ox + W, b, oz]) // أفريز أمامي يمين
    const e2 = add([ox + W, b, oz + D]) // خلفي يمين
    const e3 = add([ox, b, oz + D]) // خلفي يسار
    const r0 = add([ox, rh, rz]) // ريدج يسار
    const r1 = add([ox + W, rh, rz]) // ريدج يمين
    faces.push([e0, e1, r1, r0]) // ميل أمامي
    faces.push([e3, r0, r1, e2]) // ميل خلفي
    faces.push([e0, r0, e3]) // جملون يسار
    faces.push([e1, e2, r1]) // جملون يمين
    return { verts, faces }
  }

  // hip — أربعة ميول
  const rh = b + (D / 2) * t
  const inset = D / 2
  const rx0 = Math.min(ox + inset, ox + W / 2)
  const rx1 = Math.max(ox + W - inset, ox + W / 2)
  const rz = oz + D / 2
  const c0 = add([ox, b, oz])
  const c1 = add([ox + W, b, oz])
  const c2 = add([ox + W, b, oz + D])
  const c3 = add([ox, b, oz + D])
  const r0 = add([rx0, rh, rz])
  const r1 = add([rx1, rh, rz])
  faces.push([c0, c1, r1, r0]) // أمام
  faces.push([c3, r0, r1, c2]) // خلف
  faces.push([c0, r0, c3]) // يسار
  faces.push([c1, c2, r1]) // يمين
  return { verts, faces }
}

// خطوط الريدج/الأضلاع للمعاينة المسقطية
export function roofPlan(roof: Roof): { outline: Vec2[]; ridges: Vec2[][] } {
  const { ox, oz, W, D } = footprint(roof)
  const outline: Vec2[] = [
    { x: ox, y: oz },
    { x: ox + W, y: oz },
    { x: ox + W, y: oz + D },
    { x: ox, y: oz + D },
  ]
  const ridges: Vec2[][] = []
  if (roof.kind === 'gable') {
    ridges.push([
      { x: ox, y: oz + D / 2 },
      { x: ox + W, y: oz + D / 2 },
    ])
  } else if (roof.kind === 'hip') {
    const inset = D / 2
    const rx0 = Math.min(ox + inset, ox + W / 2)
    const rx1 = Math.max(ox + W - inset, ox + W / 2)
    const rz = oz + D / 2
    ridges.push([
      { x: rx0, y: rz },
      { x: rx1, y: rz },
    ])
    ridges.push([{ x: ox, y: oz }, { x: rx0, y: rz }])
    ridges.push([{ x: ox + W, y: oz }, { x: rx1, y: rz }])
    ridges.push([{ x: ox + W, y: oz + D }, { x: rx1, y: rz }])
    ridges.push([{ x: ox, y: oz + D }, { x: rx0, y: rz }])
  } else if (roof.kind === 'shed') {
    ridges.push([
      { x: ox + W, y: oz },
      { x: ox + W, y: oz + D },
    ])
  }
  return { outline, ridges }
}

// مساحة سطح السقف (تقريباً — مساحة المسقط ÷ cos)
export function roofArea(roof: Roof): number {
  const { W, D } = footprint(roof)
  const plan = W * D
  if (roof.kind === 'flat') return plan
  const c = Math.cos((roof.pitch * Math.PI) / 180)
  return c > 0.01 ? plan / c : plan
}
