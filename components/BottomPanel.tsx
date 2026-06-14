'use client'

import { useState } from 'react'
import PropertiesPanel from './PropertiesPanel'
import LevelsPanel from './LevelsPanel'
import LibraryPanel from './LibraryPanel'
import BoqPanel from './BoqPanel'

type Tab = 'props' | 'levels' | 'library' | 'boq'

export default function BottomPanel() {
  const [tab, setTab] = useState<Tab>('library')
  const [open, setOpen] = useState(true)

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'props', label: 'الخصائص', icon: '⚙️' },
    { id: 'library', label: 'المكتبة', icon: '☁️' },
    { id: 'levels', label: 'الطوابق', icon: '🎢' },
    { id: 'boq', label: 'الكميات', icon: '⚡' },
  ]

  return (
    <div className="shrink-0 border-t border-edge bg-panel/95 backdrop-blur z-20">
      <div className="flex items-stretch">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setOpen(true) }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition ${
              tab === t.id && open ? 'text-sky-400' : 'text-slate-400'
            }`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
        <button onClick={() => setOpen((o) => !o)} className="px-3 text-slate-400 text-sm">{open ? '▾' : '▴'}</button>
      </div>
      {open && (
        <div className="max-h-[42vh] overflow-y-auto border-t border-edge/60 animate-fade-in">
          {tab === 'props' && <PropertiesPanel />}
          {tab === 'levels' && <LevelsPanel />}
          {tab === 'library' && <LibraryPanel />}
          {tab === 'boq' && <BoqPanel />}
        </div>
      )}
    </div>
  )
}
