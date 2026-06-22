// أبعاد (Dimensions) — خطوط قياس بين نقطتين + توليد تلقائي من الجدران.
import type { RevtProject, Vec2, WallElement } from '@/lib/types'
import { dist, round2, uid } from '@/lib/geometry'

export interface Dimension {
  id: string
  a: Vec2
  b: Vec2
  offset: number // إزاحة خط القياس عن المحور (م)
  label?: string // نص مخصص (وإلا يُحسب الطول)
}

export function dimLength(d: Dimension): number {
  return round2(dist(d.a, d.b))
}

export function formatLen(m: number): string {
  return `${round2(m)} م`
}

export function dimText(d: Dimension): string {
  return d.label && d.label.trim() ? d.label : formatLen(dimLength(d))
}

// توليد بُعد لكل جدار في المنسوب
export function autoDimensions(project: RevtProject, levelId?: string): Dimension[] {
  const walls = project.elements.filter(
    (e) => e.kind === 'wall' && (!levelId || e.levelId === levelId),
  ) as WallElement[]
  return walls.map((w) => ({
    id: uid('dim'),
    a: { x: w.a.x, y: w.a.y },
    b: { x: w.b.x, y: w.b.y },
    offset: 0.4,
  }))
}
