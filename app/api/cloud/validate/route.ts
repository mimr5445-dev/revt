import { NextRequest, NextResponse } from 'next/server'
import type { Element, RevtProject } from '@/lib/types'
import { dist } from '@/lib/geometry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Issue = { level: 'error' | 'warning' | 'info'; message: string; elementId?: string }

// فحص النموذج سحابيًا: جدران صفرية، فتحات أعرض من الجدار، أبواب أعلى من الجدار...
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const project = body?.project as RevtProject
    if (!project || project.schema !== 'revt') {
      return NextResponse.json({ ok: false, error: 'نموذج غير صالح.' }, { status: 400 })
    }
    const issues: Issue[] = []
    const walls = new Map<string, Extract<Element, { kind: 'wall' }>>()
    for (const e of project.elements) if (e.kind === 'wall') walls.set(e.id, e)

    for (const e of project.elements) {
      if (e.kind === 'wall') {
        const len = dist(e.a, e.b)
        if (len < 0.05) issues.push({ level: 'error', message: 'جدار بطول صفري تقريبًا.', elementId: e.id })
        if (e.height <= 0) issues.push({ level: 'error', message: 'ارتفاع جدار غير صالح.', elementId: e.id })
      }
      if (e.kind === 'door' || e.kind === 'window') {
        const host = walls.get(e.hostId)
        if (!host) {
          issues.push({ level: 'error', message: 'فتحة غير مرتبطة بجدار.', elementId: e.id })
        } else {
          const len = dist(host.a, host.b)
          if (e.width > len) issues.push({ level: 'warning', message: 'عرض الفتحة أكبر من طول الجدار.', elementId: e.id })
          if (e.sill + e.height > host.height) issues.push({ level: 'warning', message: 'الفتحة تتجاوز ارتفاع الجدار.', elementId: e.id })
        }
      }
    }

    if (project.elements.length === 0) issues.push({ level: 'info', message: 'النموذج فارغ — ابدأ برسم جدار.' })

    const summary = {
      errors: issues.filter((i) => i.level === 'error').length,
      warnings: issues.filter((i) => i.level === 'warning').length,
    }
    return NextResponse.json({ ok: true, provider: 'Revt Cloud Validator', summary, issues })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 })
  }
}
