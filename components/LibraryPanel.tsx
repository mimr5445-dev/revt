'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import type { LibraryCatalog } from '@/lib/types'

export default function LibraryPanel() {
  const library = useStore((s) => s.library)
  const setLibrary = useStore((s) => s.setLibrary)
  const activeWallTypeId = useStore((s) => s.activeWallTypeId)
  const setActiveWallType = useStore((s) => s.setActiveWallType)
  const activeDoorTypeId = useStore((s) => s.activeDoorTypeId)
  const setActiveDoorType = useStore((s) => s.setActiveDoorType)
  const activeWindowTypeId = useStore((s) => s.activeWindowTypeId)
  const setActiveWindowType = useStore((s) => s.setActiveWindowType)
  const setTool = useStore((s) => s.setTool)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')

  async function sync() {
    setStatus('loading')
    try {
      const res = await fetch('/api/cloud/library', { cache: 'no-store' })
      const data = await res.json()
      if (data?.ok && data.catalog) {
        setLibrary(data.catalog as LibraryCatalog)
        setStatus('ok')
      } else setStatus('err')
    } catch {
      setStatus('err')
    }
  }

  useEffect(() => {
    sync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pill = (active: boolean) =>
    `text-right rounded-xl border px-3 py-2 text-[13px] transition ${active ? 'border-sky-400 bg-sky-500/10 text-white' : 'border-edge bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'}`

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-200 text-sm">☁️ المكتبة السحابية</h3>
        <button onClick={sync} className="text-[11px] px-2 py-1 rounded-lg bg-white/5 text-slate-300">
          {status === 'loading' ? '…جارٍ المزامنة' : status === 'ok' ? '✓ متصل' : status === 'err' ? '⚠ محلي' : 'تحديث'}
        </button>
      </div>

      <section>
        <div className="text-[11px] text-slate-500 mb-1.5">أنواع الجدران — انقر ثم ارسم</div>
        <div className="grid grid-cols-2 gap-1.5">
          {library.wallTypes.map((w) => (
            <button key={w.id} className={pill(activeWallTypeId === w.id)} onClick={() => { setActiveWallType(w.id); setTool('wall') }}>
              {w.name}<div className="text-[10px] text-slate-500">{(w.thickness * 100).toFixed(0)} سم</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="text-[11px] text-slate-500 mb-1.5">أنواع الأبواب</div>
        <div className="grid grid-cols-2 gap-1.5">
          {library.doorTypes.map((d) => (
            <button key={d.id} className={pill(activeDoorTypeId === d.id)} onClick={() => { setActiveDoorType(d.id); setTool('door') }}>{d.name}</button>
          ))}
        </div>
      </section>

      <section>
        <div className="text-[11px] text-slate-500 mb-1.5">أنواع النوافذ</div>
        <div className="grid grid-cols-2 gap-1.5">
          {library.windowTypes.map((wn) => (
            <button key={wn.id} className={pill(activeWindowTypeId === wn.id)} onClick={() => { setActiveWindowType(wn.id); setTool('window') }}>{wn.name}</button>
          ))}
        </div>
      </section>
    </div>
  )
}
