import { NextResponse } from 'next/server'
import { CLOUD_LIBRARY } from '@/lib/library'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// المكتبة السحابية: تُرجع أنواع الجدران والأبواب والنوافذ والمواد
export async function GET() {
  return NextResponse.json({
    ok: true,
    provider: 'Revt Cloud Library',
    updatedAt: new Date().toISOString(),
    catalog: CLOUD_LIBRARY,
  })
}
