'use client'

import { useStore } from '@/lib/store'
import type { Element } from '@/lib/types'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-[12px] text-slate-400">{label}</span>
      <span className="flex-1 max-w-[160px]">{children}</span>
    </label>
  )
}

function Num({ value, step = 0.05, min = 0, onChange }: { value: number; step?: number; min?: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      step={step}
      min={min}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full bg-ink border border-edge rounded-lg px-2 py-1 text-sm text-slate-100 text-left tabular-nums"
    />
  )
}

export default function PropertiesPanel() {
  const selectedId = useStore((s) => s.selectedId)
  const project = useStore((s) => s.project)
  const update = useStore((s) => s.updateElement)
  const remove = useStore((s) => s.deleteElement)
  const el = project.elements.find((e) => e.id === selectedId) as Element | undefined

  if (!el) {
    return <div className="p-4 text-center text-[13px] text-slate-500">اختر عنصرًا من المشهد لتعديل خصائصه.</div>
  }

  const kindName: Record<string, string> = { wall: 'جدار', slab: 'أرضية', column: 'عمود', door: 'باب', window: 'نافذة' }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-200 text-sm">خصائص: {kindName[el.kind]}</h3>
        <button onClick={() => remove(el.id)} className="text-[12px] px-2 py-1 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25">🗑 حذف</button>
      </div>

      <div className="divide-y divide-edge/60">
        {el.kind === 'wall' && (
          <>
            <Row label="الارتفاع (م)"><Num value={el.height} onChange={(n) => update(el.id, { height: n })} /></Row>
            <Row label="السمك (م)"><Num value={el.thickness} step={0.01} onChange={(n) => update(el.id, { thickness: n })} /></Row>
          </>
        )}
        {el.kind === 'slab' && (
          <>
            <Row label="العرض X (م)"><Num value={el.width} onChange={(n) => update(el.id, { width: n })} /></Row>
            <Row label="العمق Y (م)"><Num value={el.depth} onChange={(n) => update(el.id, { depth: n })} /></Row>
            <Row label="السمك (م)"><Num value={el.thickness} step={0.01} onChange={(n) => update(el.id, { thickness: n })} /></Row>
          </>
        )}
        {el.kind === 'column' && (
          <>
            <Row label="العرض (م)"><Num value={el.width} step={0.01} onChange={(n) => update(el.id, { width: n })} /></Row>
            <Row label="العمق (م)"><Num value={el.depth} step={0.01} onChange={(n) => update(el.id, { depth: n })} /></Row>
            <Row label="الارتفاع (م)"><Num value={el.height} onChange={(n) => update(el.id, { height: n })} /></Row>
          </>
        )}
        {(el.kind === 'door' || el.kind === 'window') && (
          <>
            <Row label="العرض (م)"><Num value={el.width} step={0.05} onChange={(n) => update(el.id, { width: n })} /></Row>
            <Row label="الارتفاع (م)"><Num value={el.height} step={0.05} onChange={(n) => update(el.id, { height: n })} /></Row>
            {el.kind === 'window' && <Row label="ارتفاع الجلسة (م)"><Num value={el.sill} step={0.05} onChange={(n) => update(el.id, { sill: n })} /></Row>}
            <Row label="الموقع على الجدار"><Num value={Math.round(el.t * 100)} step={1} min={0} onChange={(n) => update(el.id, { t: Math.max(0, Math.min(1, n / 100)) })} /></Row>
          </>
        )}
        {(el.kind === 'wall' || el.kind === 'slab' || el.kind === 'column') && (
          <Row label="المادة">
            <select
              value={(el as any).material}
              onChange={(e) => update(el.id, { material: e.target.value } as any)}
              className="w-full bg-ink border border-edge rounded-lg px-2 py-1 text-sm text-slate-100"
            >
              {project.materials.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </Row>
        )}
      </div>
    </div>
  )
}
