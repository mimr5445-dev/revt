import type { Vec2 } from './types'

export const dist = (a: Vec2, b: Vec2): number => Math.hypot(b.x - a.x, b.y - a.y)
export const angle = (a: Vec2, b: Vec2): number => Math.atan2(b.y - a.y, b.x - a.x)
export const mid = (a: Vec2, b: Vec2): Vec2 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
export const snap = (v: number, grid: number): number => Math.round(v / grid) * grid
export const snapVec = (p: Vec2, grid: number): Vec2 => ({ x: snap(p.x, grid), y: snap(p.y, grid) })
export const round2 = (n: number): number => Math.round(n * 100) / 100
export const round3 = (n: number): number => Math.round(n * 1000) / 1000

export function closestOnSegment(p: Vec2, a: Vec2, b: Vec2) {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const len2 = abx * abx + aby * aby
  let t = len2 === 0 ? 0 : ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2
  t = Math.max(0, Math.min(1, t))
  const point: Vec2 = { x: a.x + t * abx, y: a.y + t * aby }
  return { t, point, distance: dist(p, point) }
}

let counter = 0
export function uid(prefix = 'el'): string {
  counter += 1
  return prefix + '_' + Date.now().toString(36) + '_' + counter.toString(36)
}
