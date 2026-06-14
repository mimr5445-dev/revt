'use client'

import { useRef, useState } from 'react'
import { useStore } from '@/lib/store'
import { downloadProject, parseProject } from '@/lib/revt-file'

export default function TopBar() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [menu, setMenu] = useState(false)
  const project = useStore((s) => s.project)
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  const setProjectName = useStore((s) => s.setProjectName)
  const newProject = useStore((s) => s.newProject)
  const loadProject = useStore((s) => s.loadProject)

  async function onOpen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      loadProject(parseProject(text))
    } catch (err: any) {
      alert('تعذّر فتح الملف: ' + (err?.message ?? err))
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const tabBtn = (v: 'plan' | '3d', label: string) =>
    `px-3 py-1.5 rounded-lg text-[13px] font-bold transition ${view === v ? 'bg-sky-500 text-white' : 'bg-white/5 text-slate-300'}`

  return (
    <header className="shrink-0 h-12 flex items-center gap-2 px-2 border-b border-edge bg-panel/95 backdrop-blur z-30">
      <div className="flex items-center gap-1.5 font-extrabold text-sky-400 px-1">
        <span className="text-lg">◣</span>
        <span>Revt</span>
      </div>

      <input
        value={project.name}
        onChange={(e) => setProjectName(e.target.value)}
        className="flex-1 min-w-0 bg-transparent text-sm text-slate-200 outline-none px-2 py-1 rounded hover:bg-white/5 focus:bg-white/5"
        aria-label="اسم المشروع"
      />

      <div className="hidden sm:flex items-center gap-1 bg-ink/60 rounded-lg p-0.5">
        <button className={tabBtn('plan', '')} onClick={() => setView('plan')}>📐 مسقط</button>
        <button className={tabBtn('3d', '')} onClick={() => setView('3d')}>🧊 3D</button>
      </div>

      <div className="relative">
        <button onClick={() => setMenu((m) => !m)} className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-200 text-[13px] font-bold">☰</button>
        {menu && (
          <div className="absolute left-0 mt-1 w-44 rounded-xl border border-edge bg-panel shadow-2xl p-1 z-40 animate-fade-in" onClick={() => setMenu(false)}>
            <button className="w-full text-right px-3 py-2 rounded-lg hover:bg-white/5 text-sm" onClick={() => { if (confirm('بدء مشروع جديد؟ سيتم مسح الحالي.')) newProject() }}>📄 مشروع جديد</button>
            <button className="w-full text-right px-3 py-2 rounded-lg hover:bg-white/5 text-sm" onClick={() => fileRef.current?.click()}>📂 فتح ملف .revt</button>
            <button className="w-full text-right px-3 py-2 rounded-lg hover:bg-white/5 text-sm" onClick={() => downloadProject(project)}>💾 حفظ .revt</button>
            <button className="w-full text-right px-3 py-2 rounded-lg hover:bg-white/5 text-sm" onClick={() => window.dispatchEvent(new Event('revt-export-glb'))}>🧊 تصدير 3D (GLB)</button>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept=".revt,application/json" className="hidden" onChange={onOpen} />
    </header>
  )
}
