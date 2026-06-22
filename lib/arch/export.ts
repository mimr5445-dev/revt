// تصدير العناصر المعمارية (أسقف + درج) إلى OBJ.
import type { Mesh } from './roof'
import { computeRoofMesh, type Roof } from './roof'
import { stairMesh, type Stair } from './stairs'

function appendMesh(
  verts: string[],
  faces: string[],
  base: number,
  mesh: Mesh,
): number {
  for (const v of mesh.verts) verts.push(`v ${v[0]} ${v[1]} ${v[2]}`)
  for (const f of mesh.faces) {
    faces.push('f ' + f.map((idx) => base + idx + 1).join(' '))
  }
  return base + mesh.verts.length
}

export function archToOBJ(roofs: Roof[], stairs: Stair[]): string {
  const verts: string[] = []
  const faces: string[] = []
  let base = 0
  for (const r of roofs) {
    faces.push(`g roof_${r.id}`)
    base = appendMesh(verts, faces, base, computeRoofMesh(r))
  }
  for (const s of stairs) {
    faces.push(`g stair_${s.id}`)
    base = appendMesh(verts, faces, base, stairMesh(s))
  }
  return `# Revt arch OBJ export\n${verts.join('\n')}\n${faces.join('\n')}\n`
}
