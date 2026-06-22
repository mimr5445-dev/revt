// درج بارامتري — حساب القائمة/النائمة وتوليد الدرجات.
import type { Vec2 } from '@/lib/types'
import { round2, round3 } from '@/lib/geometry'
import type { Mesh, Vert3 } from './roof'

export interface Stair {
  id: string
  name: string
  start: Vec2 // بداية أول قائمة (الحافة اليسرى)
  direction: number // اتجاه الصعود (درجات)
  width: number // عرض الدرج (م)
  totalRise: number // ارتفاع دور-لدور (م)
  treadDepth: number // عمق النائمة (م)
  riserHeight: number // ارتفاع القائمة المستهدف (م)
  baseElevation: number // منسوب البداية (م)
}

export interface StairCalc {
  steps: number
  actualRiser: number
  runLength: number
  angleDeg: number
}

function dirVec(deg: number): { fx: number; fy: number; rx: number; ry: number } {
  const a = (deg * Math.PI) / 180
  const fx = Math.cos(a)
  const fy = Math.sin(a)
  // عمودي لليسار (عرض الدرج)
  return { fx, fy, rx: -fy, ry: fx }
}

export function computeStair(s: Stair): StairCalc {
  const steps = Math.max(1, Math.round(s.totalRise / Math.max(0.01, s.riserHeight)))
  const actualRiser = s.totalRise / steps
  const runLength = steps * s.treadDepth
  const angleDeg = (Math.atan2(actualRiser, s.treadDepth) * 180) / Math.PI
  return {
    steps,
    actualRiser: round3(actualRiser),
    runLength: round2(runLength),
    angleDeg: round2(angleDeg),
  }
}

// مسقط الدرج: إطار خارجي + خطوط النوائم
export function stairPlan(s: Stair): { outline: Vec2[]; treads: Vec2[][] } {
  const { steps } = computeStair(s)
  const { fx, fy, rx, ry } = dirVec(s.direction)
  const L = steps * s.treadDepth
  const w = s.width
  const p = (along: number, across: number): Vec2 => ({
    x: s.start.x + fx * along + rx * across,
    y: s.start.y + fy * along + ry * across,
  })
  const outline = [p(0, 0), p(L, 0), p(L, w), p(0, w)]
  const treads: Vec2[][] = []
  for (let i = 1; i < steps; i++) {
    treads.push([p(i * s.treadDepth, 0), p(i * s.treadDepth, w)])
  }
  return { outline, treads }
}

// مجسّم ثلاثي: صندوق لكل درجة (متصاعد)
export function stairMesh(s: Stair): Mesh {
  const { steps, actualRiser } = computeStair(s)
  const { fx, fy, rx, ry } = dirVec(s.direction)
  const w = s.width
  const verts: Vert3[] = []
  const faces: number[][] = []
  const p2 = (along: number, across: number) => ({
    x: s.start.x + fx * along + rx * across,
    y: s.start.y + fy * along + ry * across,
  })
  for (let i = 0; i < steps; i++) {
    const a0 = p2(i * s.treadDepth, 0)
    const a1 = p2((i + 1) * s.treadDepth, 0)
    const a2 = p2((i + 1) * s.treadDepth, w)
    const a3 = p2(i * s.treadDepth, w)
    const y0 = s.baseElevation
    const y1 = s.baseElevation + (i + 1) * actualRiser
    const base = verts.length
    const corners = [a0, a1, a2, a3]
    for (const c of corners) verts.push([c.x, y0, c.y])
    for (const c of corners) verts.push([c.x, y1, c.y])
    const k = (n: number) => base + n
    faces.push([k(0), k(1), k(2), k(3)])
    faces.push([k(4), k(5), k(6), k(7)])
    faces.push([k(0), k(1), k(5), k(4)])
    faces.push([k(1), k(2), k(6), k(5)])
    faces.push([k(2), k(3), k(7), k(6)])
    faces.push([k(3), k(0), k(4), k(7)])
  }
  return { verts, faces }
}
