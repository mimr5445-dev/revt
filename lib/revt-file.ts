import type { RevtProject } from './types'
import { CLOUD_LIBRARY } from './library'
import { uid } from './geometry'

export const REVT_VERSION = 1

export function createEmptyProject(name = 'مشروع جديد'): RevtProject {
  const now = new Date().toISOString()
  return {
    schema: 'revt',
    version: REVT_VERSION,
    name,
    units: 'm',
    createdAt: now,
    updatedAt: now,
    levels: [
      { id: 'L0', name: 'الدور الأرضي', elevation: 0, height: 3.2 },
      { id: 'L1', name: 'الدور الأول', elevation: 3.2, height: 3.2 },
    ],
    elements: [],
    materials: CLOUD_LIBRARY.materials,
  }
}

export function serializeProject(project: RevtProject): string {
  const out: RevtProject = { ...project, updatedAt: new Date().toISOString() }
  return JSON.stringify(out, null, 2)
}

// قراءة وتحقّق وترقية لملف .revt
export function parseProject(text: string): RevtProject {
  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('الملف ليس بصيغة .revt صالحة (JSON غير صحيح).')
  }
  if (!data || data.schema !== 'revt') {
    throw new Error('هذا الملف ليس مشروع Revt.')
  }
  const base = createEmptyProject(data.name || 'مشروع مستورد')
  const project: RevtProject = {
    ...base,
    ...data,
    schema: 'revt',
    version: REVT_VERSION,
    units: 'm',
    levels: Array.isArray(data.levels) && data.levels.length ? data.levels : base.levels,
    elements: Array.isArray(data.elements) ? data.elements : [],
    materials: Array.isArray(data.materials) && data.materials.length ? data.materials : base.materials,
  }
  // ضمان وجود معرّفات
  project.elements = project.elements.map((e: any) => ({ ...e, id: e.id || uid(e.kind || 'el') }))
  return project
}

export function downloadProject(project: RevtProject) {
  const text = serializeProject(project)
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safe = (project.name || 'revt-project').replace(/[^\p{L}\p{N}_-]+/gu, '-')
  a.href = url
  a.download = safe + '.revt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadText(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime + ';charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
