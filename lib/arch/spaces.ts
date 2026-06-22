// فراغات مُسمّاة — تُبنى من كاشف الغرف (v0.3) وتقبل التسمية.
import type { RevtProject, Vec2 } from '@/lib/types'
import { detectRooms } from '@/lib/analysis/rooms'
import { uid } from '@/lib/geometry'

export interface Space {
  id: string
  name: string
  polygon: Vec2[]
  area: number
  centroid: Vec2
}

export function buildSpaces(project: RevtProject, levelId?: string): Space[] {
  const rooms = detectRooms(project, levelId)
  return rooms.map((r, i) => ({
    id: uid('space'),
    name: `غرفة ${i + 1}`,
    polygon: r.polygon,
    area: r.area,
    centroid: r.centroid,
  }))
}

export function renameSpace(spaces: Space[], id: string, name: string): Space[] {
  return spaces.map((s) => (s.id === id ? { ...s, name } : s))
}

export function spaceLabel(s: Space): string {
  return `${s.name} · ${s.area} م²`
}
