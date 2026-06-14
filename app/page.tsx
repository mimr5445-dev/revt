'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import TopBar from '@/components/TopBar'
import ToolStrip from '@/components/ToolStrip'
import BottomPanel from '@/components/BottomPanel'
import PlanEditor from '@/components/PlanEditor'
import { useStore } from '@/lib/store'

const Viewport3D = dynamic(() => import('@/components/Viewport3D'), { ssr: false })

export default function Page() {
  const view = useStore((s) => s.view)
  const hydrate = useStore((s) => s.hydrate)
  const hydrated = useStore((s) => s.hydrated)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <>
      <TopBar />
      <ToolStrip />
      <main className="relative flex-1 min-h-0">
        {!hydrated && (
          <div className="absolute inset-0 grid place-items-center text-slate-500 text-sm">…جارٍ التحميل</div>
        )}
        <div className={view === '3d' ? 'hidden' : 'absolute inset-0'}>
          <PlanEditor />
        </div>
        {view === '3d' && (
          <div className="absolute inset-0">
            <Viewport3D />
          </div>
        )}
      </main>
      <BottomPanel />
    </>
  )
}
