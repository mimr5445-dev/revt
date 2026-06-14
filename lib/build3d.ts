import * as THREE from 'three'
import type { Element, RevtProject, Vec2 } from './types'
import { dist, angle } from './geometry'

function colorOf(project: RevtProject, materialId: string, fallback = '#9aa3b2'): string {
  return project.materials.find((m) => m.id === materialId)?.color ?? fallback
}

function box(w: number, h: number, d: number, mat: THREE.Material): THREE.Mesh {
  const g = new THREE.BoxGeometry(w, h, d)
  const mesh = new THREE.Mesh(g, mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

// يبني مجموعة جدار مع فتحات (تقسيم الجدار إلى أجزاء + عتبات)
function buildWall(
  project: RevtProject,
  wall: Extract<Element, { kind: 'wall' }>,
  openings: Array<Extract<Element, { kind: 'door' | 'window' }>>,
  elevation: number,
): THREE.Group {
  const group = new THREE.Group()
  group.userData.elementId = wall.id
  const L = dist(wall.a, wall.b)
  const H = wall.height
  const T = wall.thickness
  if (L < 0.01) return group

  const wallMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorOf(project, wall.material)),
    roughness: 0.85,
    metalness: 0.02,
  })
  const glassMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#7fc7e6'),
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.45,
  })
  const doorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#6b4423'),
    roughness: 0.6,
  })

  // ترتيب الفتحات حسب الموقع على الجدار
  const ops = openings
    .map((o) => ({ o, cx: o.t * L }))
    .sort((a, b) => a.cx - b.cx)

  let cursor = 0
  const addSegment = (from: number, to: number) => {
    const segLen = to - from
    if (segLen <= 0.001) return
    const seg = box(segLen, H, T, wallMat)
    seg.position.set(from + segLen / 2 - L / 2, H / 2, 0)
    group.add(seg)
  }

  for (const { o, cx } of ops) {
    const half = o.width / 2
    const left = Math.max(0, cx - half)
    const right = Math.min(L, cx + half)
    addSegment(cursor, left)
    // أسفل النافذة (جلسة)
    if (o.sill > 0.001) {
      const sill = box(right - left, o.sill, T, wallMat)
      sill.position.set(left + (right - left) / 2 - L / 2, o.sill / 2, 0)
      group.add(sill)
    }
    // العتبة فوق الفتحة
    const topY = o.sill + o.height
    if (topY < H - 0.001) {
      const header = box(right - left, H - topY, T, wallMat)
      header.position.set(left + (right - left) / 2 - L / 2, topY + (H - topY) / 2, 0)
      group.add(header)
    }
    // لوح الباب/النافذة
    const panel = box(Math.max(0.01, right - left - 0.04), o.height - 0.04, T * 0.34, o.kind === 'window' ? glassMat : doorMat)
    panel.position.set(left + (right - left) / 2 - L / 2, o.sill + o.height / 2, 0)
    group.add(panel)
    cursor = right
  }
  addSegment(cursor, L)

  // تدوير وإزاحة المجموعة إلى موقع الجدار في العالم (XZ plane, Y up)
  const mx = (wall.a.x + wall.b.x) / 2
  const my = (wall.a.y + wall.b.y) / 2
  group.position.set(mx, elevation, -my)
  group.rotation.y = -angle(wall.a, wall.b)
  return group
}

export function buildScene(project: RevtProject): THREE.Group {
  const root = new THREE.Group()
  root.name = 'revt-model'
  const levelById = new Map(project.levels.map((l) => [l.id, l]))

  const wallsById = new Map<string, Extract<Element, { kind: 'wall' }>>()
  for (const e of project.elements) if (e.kind === 'wall') wallsById.set(e.id, e)

  const openingsByWall = new Map<string, Array<Extract<Element, { kind: 'door' | 'window' }>>>()
  for (const e of project.elements) {
    if (e.kind === 'door' || e.kind === 'window') {
      const arr = openingsByWall.get(e.hostId) ?? []
      arr.push(e)
      openingsByWall.set(e.hostId, arr)
    }
  }

  for (const e of project.elements) {
    const level = levelById.get(e.levelId)
    const elevation = level?.elevation ?? 0

    if (e.kind === 'wall') {
      root.add(buildWall(project, e, openingsByWall.get(e.id) ?? [], elevation))
    } else if (e.kind === 'slab') {
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorOf(project, e.material)), roughness: 0.9 })
      const mesh = box(e.width, e.thickness, e.depth, mat)
      mesh.position.set(e.origin.x + e.width / 2, elevation - e.thickness / 2, -(e.origin.y + e.depth / 2))
      mesh.userData.elementId = e.id
      root.add(mesh)
    } else if (e.kind === 'column') {
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorOf(project, e.material)), roughness: 0.8 })
      const mesh = box(e.width, e.height, e.depth, mat)
      mesh.position.set(e.at.x, elevation + e.height / 2, -e.at.y)
      mesh.userData.elementId = e.id
      root.add(mesh)
    }
  }
  return root
}
