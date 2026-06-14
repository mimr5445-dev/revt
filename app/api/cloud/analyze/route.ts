import { NextRequest, NextResponse } from 'next/server'
import { computeBoq } from '@/lib/boq'
import type { RevtProject } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// المعالج السحابي: يستقبل النموذج ويحسب الكميات والتكاليف (BOQ)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const project = body?.project as RevtProject
    if (!project || project.schema !== 'revt') {
      return NextResponse.json({ ok: false, error: 'نموذج غير صالح.' }, { status: 400 })
    }
    const currency = body?.currency || process.env.NEXT_PUBLIC_CURRENCY || 'SAR'
    const startedAt = Date.now()
    const result = computeBoq(project, currency)
    return NextResponse.json({
      ok: true,
      provider: 'Revt Cloud Processor',
      computeMs: Date.now() - startedAt,
      result,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 })
  }
}
