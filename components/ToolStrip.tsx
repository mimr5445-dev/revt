'use client'

import { useStore, type Tool } from '@/lib/store'

const TOOLS: Array<{ id: Tool; label: string; icon: string }> = [
  { id: 'select', label: 'تحديد', icon: '↖' },
  { id: 'wall', label: 'جدار', icon: '▉' },
  { id: 'slab', label: 'أرضية', icon: '▢' },
  { id: 'column', label: 'عمود', icon: '▪' },
  { id: 'door', label: 'باب', icon: '🚪' },
  { id: 'window', label: 'نافذة', icon: '▦' },
  { id: 'pan', label: 'تحريك', icon: '✋' },
]

export default function ToolStrip() {
  const tool = useStore((s) => s.tool)
  const setTool = useStore((s) => s.setTool)
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  const levels = useStore((s) => s.project.levels)
  const activeLevelId = useStore((s) => s.activeLevelId)
  const setActiveLevel = useStore((s) => s.setActiveLevel)

  return (
    <div className="shrink-0 flex items-center gap-1 px-2 py-1.5 border-b border-edge bg-ink/80 overflow-x-auto">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          title={t.label}
          className={`flex flex-col items-center justify-center min-w-[52px] h-12 rounded-xl text-[10px] gap-0.5 transition ${
            tool === t.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          <span className="text-base leading-none">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}

      <div className="flex-1" />

      <select
        value={activeLevelId}
        onChange={(e) => setActiveLevel(e.target.value)}
        className="h-9 rounded-lg bg-white/5 border border-edge text-slate-200 text-[12px] px-2"
        aria-label="الطابق النشط"
      >
        {levels.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>

      <div className="sm:hidden flex items-center gap-1 bg-white/5 rounded-lg p-0.5 ml-1">
        <button onClick={() => setView('plan')} className={`px-2 py-1 rounded-md text-xs ${view === 'plan' ? 'bg-sky-500 text-white' : 'text-slate-300'}`}>2D</button>
        <button onClick={() => setView('3d')} className={`px-2 py-1 rounded-md text-xs ${view === '3d' ? 'bg-sky-500 text-white' : 'text-slate-300'}`}>3D</button>
      </div>
    </div>
  )
}
