'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useStore } from '@/lib/store'
import { useArch } from '@/lib/arch/store'
import { roofPlan, ridgeHeight, type RoofKind } from '@/lib/arch/roof'
import { computeStair, stairPlan } from '@/lib/arch/stairs'
import { autoDimensions, dimText } from '@/lib/arch/dimensions'
import { buildSpaces, spaceLabel } from '@/lib/arch/spaces'
import { archToOBJ } from '@/lib/arch/export'
import { boundingBox } from '@/lib/analysis/measure'
import type { Vec2 } from '@/lib/types'

type Tab = 'roofs' | 'stairs' | 'dims' | 'spaces'

function download(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

const ROOF_KINDS: Array<[RoofKind, string]> = [
  ['gable', 'جملون'],
  ['hip', 'هرمي'],
  ['shed', 'مائل'],
  ['flat', 'مسطح'],
]

export default function ArchPanel() {
  const project = useStore((s) => s.project)
  const activeLevelId = useStore((s) => s.activeLevelId)
  const arch = useArch((s) => s)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('roofs')

  useEffect(() => {
    arch.hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bbox = useMemo(() => boundingBox(project.elements), [project])

  // حدود المعاينة
  const view = useMemo(() => {
    const pad = 1
    const minX = (bbox?.min.x ?? -5) - pad
    const minY = (bbox?.min.y ?? -5) - pad
    const w = (bbox ? bbox.width : 10) + pad * 2
    const h = (bbox ? bbox.depth : 10) + pad * 2
    return { minX, minY, w: Math.max(w, 1), h: Math.max(h, 1) }
  }, [bbox])

  const [roofForm, setRoofForm] = useState({ kind: 'gable' as RoofKind, pitch: 30, overhang: 0.4, thickness: 0.2, baseElevation: 3.2 })
  const [stairForm, setStairForm] = useState({ width: 1, totalRise: 3.2, treadDepth: 0.28, riserHeight: 0.18, direction: 0, baseElevation: 0 })

  function addRoofOverBuilding() {
    if (!bbox) return
    arch.addRoof({
      name: `سقف ${arch.roofs.length + 1}`,
      origin: { x: bbox.min.x, y: bbox.min.y },
      width: bbox.width,
      depth: bbox.depth,
      ...roofForm,
    })
  }
  function addStairHere() {
    const c = bbox?.center ?? { x: 0, y: 0 }
    arch.addStair({ name: `درج ${arch.stairs.length + 1}`, start: { x: c.x, y: c.y }, ...stairForm })
  }

  const fab: CSSProperties = { position: 'fixed', zIndex: 45, insetInlineEnd: 12, top: 'calc(env(safe-area-inset-top) + 164px)' }
  const sheet: CSSProperties = { position: 'fixed', zIndex: 46, insetInlineEnd: 0, top: 0, bottom: 0, width: 'min(400px, 92vw)' }
  const svgStyle: CSSProperties = { height: 180 }

  return (
    <>
      <button style={fab} onClick={() => setOpen((v) => !v)} className="px-3 h-10 rounded-xl border border-edge bg-panel text-slate-100 text-sm font-semibold hover:bg-white/10 transition" title="عناصر معمارية">
        🏛️ معماري
      </button>

      {open && (
        <div style={sheet} className="bg-ink/95 border-s border-edge backdrop-blur flex flex-col">
          <div className="flex items-center justify-between px-4 h-12 border-b border-edge">
            <span className="text-slate-100 font-semibold">العناصر المعمارية</span>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
          </div>

          {/* معاينة مسقطية */}
          <div className="border-b border-edge bg-black/30">
            <svg viewBox={`${view.minX} ${view.minY} ${view.w} ${view.h}`} className="w-full" style={svgStyle} preserveAspectRatio="xMidYMid meet">
              {bbox && (
                <rect x={bbox.min.x} y={bbox.min.y} width={bbox.width} height={bbox.depth} fill="none" stroke="#334155" strokeWidth={0.05} />
              )}
              {arch.roofs.map((r) => {
                const pl = roofPlan(r)
                return (
                  <g key={r.id}>
                    <polygon points={pl.outline.map((p) => `${p.x},${p.y}`).join(' ')} fill="#1d4ed822" stroke="#60a5fa" strokeWidth={0.06} />
                    {pl.ridges.map((seg, i) => (
                      <line key={i} x1={seg[0].x} y1={seg[0].y} x2={seg[1].x} y2={seg[1].y} stroke="#f59e0b" strokeWidth={0.06} />
                    ))}
                  </g>
                )
              })}
              {arch.stairs.map((st) => {
                const pl = stairPlan(st)
                return (
                  <g key={st.id}>
                    <polygon points={pl.outline.map((p) => `${p.x},${p.y}`).join(' ')} fill="#05966922" stroke="#34d399" strokeWidth={0.06} />
                    {pl.treads.map((seg, i) => (
                      <line key={i} x1={seg[0].x} y1={seg[0].y} x2={seg[1].x} y2={seg[1].y} stroke="#34d399" strokeWidth={0.04} />
                    ))}
                  </g>
                )
              })}
              {arch.dimensions.map((d) => (
                <line key={d.id} x1={d.a.x} y1={d.a.y} x2={d.b.x} y2={d.b.y} stroke="#a78bfa" strokeWidth={0.05} strokeDasharray="0.2 0.1" />
              ))}
              {arch.spaces.map((sp) => (
                <circle key={sp.id} cx={sp.centroid.x} cy={sp.centroid.y} r={0.12} fill="#f472b6" />
              ))}
            </svg>
          </div>

          <div className="flex border-b border-edge text-xs">
            {([['roofs', 'الأسقف'], ['stairs', 'الدرج'], ['dims', 'الأبعاد'], ['spaces', 'الفراغات']] as Array<[Tab, string]>).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={'flex-1 h-10 transition ' + (tab === id ? 'text-white border-b-2 border-blue-400 bg-white/5' : 'text-slate-400 hover:text-slate-200')}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-4 text-sm text-slate-200 space-y-3">
            {tab === 'roofs' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="col-span-2 text-xs text-slate-400">نوع السقف</label>
                  <div className="col-span-2 flex gap-1">
                    {ROOF_KINDS.map(([k, label]) => (
                      <button key={k} onClick={() => setRoofForm((f) => ({ ...f, kind: k }))} className={'flex-1 h-9 rounded-lg border text-xs transition ' + (roofForm.kind === k ? 'border-blue-400 bg-blue-500/20 text-white' : 'border-edge bg-panel text-slate-300')}>{label}</button>
                    ))}
                  </div>
                  <Field label="الميل (°)" value={roofForm.pitch} onChange={(v) => setRoofForm((f) => ({ ...f, pitch: v }))} />
                  <Field label="البروز (م)" value={roofForm.overhang} onChange={(v) => setRoofForm((f) => ({ ...f, overhang: v }))} step={0.1} />
                  <Field label="السمك (م)" value={roofForm.thickness} onChange={(v) => setRoofForm((f) => ({ ...f, thickness: v }))} step={0.05} />
                  <Field label="منسوب الأفاريز (م)" value={roofForm.baseElevation} onChange={(v) => setRoofForm((f) => ({ ...f, baseElevation: v }))} step={0.1} />
                </div>
                <button onClick={addRoofOverBuilding} disabled={!bbox} className="w-full h-10 rounded-lg border border-edge bg-panel hover:bg-white/10 disabled:opacity-40 transition">➕ أضف سقفاً فوق المبنى</button>
                {!bbox && <p className="text-xs text-amber-300">ارسم جدراناً أولاً لتحديد أرضية السقف.</p>}
                {arch.roofs.map((r) => (
                  <Row key={r.id} title={`${r.name} · ${ROOF_KINDS.find((x) => x[0] === r.kind)?.[1]}`} subtitle={`ارتفاع الريدج +${ridgeHeight(r).toFixed(2)} م`} onDelete={() => arch.removeRoof(r.id)} />
                ))}
              </div>
            )}

            {tab === 'stairs' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="العرض (م)" value={stairForm.width} onChange={(v) => setStairForm((f) => ({ ...f, width: v }))} step={0.1} />
                  <Field label="ارتفاع الدور (م)" value={stairForm.totalRise} onChange={(v) => setStairForm((f) => ({ ...f, totalRise: v }))} step={0.1} />
                  <Field label="عمق النائمة (م)" value={stairForm.treadDepth} onChange={(v) => setStairForm((f) => ({ ...f, treadDepth: v }))} step={0.01} />
                  <Field label="ارتفاع القائمة (م)" value={stairForm.riserHeight} onChange={(v) => setStairForm((f) => ({ ...f, riserHeight: v }))} step={0.01} />
                  <Field label="الاتجاه (°)" value={stairForm.direction} onChange={(v) => setStairForm((f) => ({ ...f, direction: v }))} />
                  <Field label="منسوب البداية (م)" value={stairForm.baseElevation} onChange={(v) => setStairForm((f) => ({ ...f, baseElevation: v }))} step={0.1} />
                </div>
                <div className="text-xs text-slate-400">
                  {(() => { const c = computeStair({ id: '', name: '', start: { x: 0, y: 0 }, ...stairForm }); return `${c.steps} درجة · قائمة ${c.actualRiser} م · طول المجرى ${c.runLength} م · زاوية ${c.angleDeg}°` })()}
                </div>
                <button onClick={addStairHere} className="w-full h-10 rounded-lg border border-edge bg-panel hover:bg-white/10 transition">➕ أضف درجاً</button>
                {arch.stairs.map((st) => {
                  const c = computeStair(st)
                  return <Row key={st.id} title={st.name} subtitle={`${c.steps} درجة · ${c.runLength} م`} onDelete={() => arch.removeStair(st.id)} />
                })}
              </div>
            )}

            {tab === 'dims' && (
              <div className="space-y-2">
                <button onClick={() => arch.setDimensions(autoDimensions(project, activeLevelId))} className="w-full h-10 rounded-lg border border-edge bg-panel hover:bg-white/10 transition">⚡ توليد تلقائي من الجدران</button>
                {arch.dimensions.length === 0 && <p className="text-xs text-slate-400">لا توجد أبعاد بعد.</p>}
                {arch.dimensions.map((d) => (
                  <Row key={d.id} title={dimText(d)} subtitle="خط قياس" onDelete={() => arch.removeDimension(d.id)} />
                ))}
              </div>
            )}

            {tab === 'spaces' && (
              <div className="space-y-2">
                <button onClick={() => arch.setSpaces(buildSpaces(project, activeLevelId))} className="w-full h-10 rounded-lg border border-edge bg-panel hover:bg-white/10 transition">⚡ توليد الفراغات من الغرف</button>
                {arch.spaces.length === 0 && <p className="text-xs text-slate-400">أغلق حلقات جدران ثم ولّد الفراغات.</p>}
                {arch.spaces.map((sp) => (
                  <div key={sp.id} className="flex items-center gap-2 border-b border-edge/50 py-1">
                    <input value={sp.name} onChange={(e: { target: { value: string } }) => arch.renameSpace(sp.id, e.target.value)} className="flex-1 bg-transparent border border-edge rounded px-2 h-8 text-slate-100" />
                    <span className="text-xs text-slate-400 tabular-nums">{sp.area} م²</span>
                  </div>
                ))}
                {arch.spaces.length > 0 && (
                  <p className="text-xs text-slate-500">{arch.spaces.map(spaceLabel).length} فراغ</p>
                )}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-edge">
            <button onClick={() => download((project.name || 'revt').replace(/\s+/g, '_') + '-arch.obj', archToOBJ(arch.roofs, arch.stairs))} disabled={arch.roofs.length === 0 && arch.stairs.length === 0} className="w-full h-10 rounded-lg border border-edge bg-panel hover:bg-white/10 disabled:opacity-40 transition">⬇ تصدير العناصر المعمارية OBJ</button>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-400">{label}</span>
      <input type="number" value={value} step={step} onChange={(e: { target: { value: string } }) => onChange(Number(e.target.value))} className="bg-transparent border border-edge rounded px-2 h-9 text-slate-100" />
    </label>
  )
}

function Row({ title, subtitle, onDelete }: { title: string; subtitle: string; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between border border-edge rounded-lg px-3 py-2">
      <div>
        <div className="text-slate-100">{title}</div>
        <div className="text-xs text-slate-400">{subtitle}</div>
      </div>
      <button onClick={onDelete} className="text-red-400 hover:text-red-300 text-sm">حذف</button>
    </div>
  )
}
