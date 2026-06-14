'use client'

import { useStore } from '@/lib/store'

export default function LevelsPanel() {
  const project = useStore((s) => s.project)
  const activeLevelId = useStore((s) => s.activeLevelId)
  const setActiveLevel = useStore((s) => s.setActiveLevel)
  const addLevel = useStore((s) => s.addLevel)
  const updateLevel = useStore((s) => s.updateLevel)
  const deleteLevel = useStore((s) => s.deleteLevel)

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-200 text-sm">الطوابق</h3>
        <button onClick={addLevel} className="text-[12px] px-2 py-1 rounded-lg bg-sky-500/15 text-sky-300 hover:bg-sky-500/25">➕ إضافة طابق</button>
      </div>
      <div className="space-y-1.5">
        {[...project.levels].sort((a, b) => b.elevation - a.elevation).map((l) => (
          <div
            key={l.id}
            className={`rounded-xl border p-2 ${activeLevelId === l.id ? 'border-sky-400 bg-sky-500/10' : 'border-edge bg-white/[0.03]'}`}
          >
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveLevel(l.id)} className="text-xs px-2 py-1 rounded-lg bg-white/5 text-slate-300">
                {activeLevelId === l.id ? '●' : '○'}
              </button>
              <input
                value={l.name}
                onChange={(e) => updateLevel(l.id, { name: e.target.value })}
                className="flex-1 bg-transparent text-sm text-slate-100 outline-none"
              />
              {project.levels.length > 1 && (
                <button onClick={() => deleteLevel(l.id)} className="text-[11px] px-2 py-1 rounded-lg bg-rose-500/15 text-rose-300">حذف</button>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 pr-9">
              <label className="flex items-center gap-1 text-[11px] text-slate-400">
                المنسوب
                <input type="number" step={0.1} value={l.elevation} onChange={(e) => updateLevel(l.id, { elevation: parseFloat(e.target.value) || 0 })}
                  className="w-16 bg-ink border border-edge rounded px-1 py-0.5 text-slate-100 text-left tabular-nums" />
              </label>
              <label className="flex items-center gap-1 text-[11px] text-slate-400">
                الارتفاع
                <input type="number" step={0.1} value={l.height} onChange={(e) => updateLevel(l.id, { height: parseFloat(e.target.value) || 0 })}
                  className="w-16 bg-ink border border-edge rounded px-1 py-0.5 text-slate-100 text-left tabular-nums" />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
