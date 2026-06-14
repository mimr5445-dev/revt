'use client'

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/lib/store'
import type { Element, Vec2 } from '@/lib/types'
import { closestOnSegment, dist, snapVec } from '@/lib/geometry'

const GRID = 0.25 // متر

export default function PlanEditor() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })
  const [scale, setScale] = useState(48) // px لكل متر
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const panRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const [cursor, setCursor] = useState<Vec2 | null>(null)

  const {
    project, activeLevelId, tool, draft, selectedId,
    setDraft, addWall, addSlab, addColumn, addOpening, select, setTool,
  } = useStore()

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const ox = size.w / 2 + offset.x
  const oy = size.h / 2 + offset.y

  // تحويل الإحداثيات
  const worldToScreen = (p: Vec2) => ({ x: ox + p.x * scale, y: oy - p.y * scale })
  const screenToWorld = (sx: number, sy: number): Vec2 => ({ x: (sx - ox) / scale, y: (oy - sy) / scale })

  const pointerWorld = (e: React.PointerEvent): Vec2 => {
    const rect = svgRef.current!.getBoundingClientRect()
    return screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
  }

  const levelElements = project.elements.filter((e) => e.levelId === activeLevelId)
  const walls = levelElements.filter((e) => e.kind === 'wall') as Extract<Element, { kind: 'wall' }>[]

  function hostWallAt(p: Vec2) {
    let best: { wall: Extract<Element, { kind: 'wall' }>; t: number; d: number } | null = null
    for (const w of walls) {
      const r = closestOnSegment(p, w.a, w.b)
      if (!best || r.distance < best.d) best = { wall: w, t: r.t, d: r.distance }
    }
    return best && best.d < 0.6 ? best : null
  }

  function onPointerDown(e: React.PointerEvent) {
    ;(e.target as Element & { setPointerCapture?: any }).setPointerCapture?.(e.pointerId)
    const w = pointerWorld(e)
    const sp = snapVec(w, GRID)

    if (tool === 'pan') {
      panRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
      return
    }
    if (tool === 'select') {
      const hit = pickElement(w)
      select(hit?.id ?? null)
      if (!hit) panRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
      return
    }
    if (tool === 'column') {
      addColumn(sp)
      return
    }
    if (tool === 'door' || tool === 'window') {
      const host = hostWallAt(w)
      if (host) addOpening(tool, host.wall.id, host.t)
      return
    }
    if (tool === 'wall' || tool === 'slab') {
      if (!draft) {
        setDraft(sp)
      } else {
        if (tool === 'wall') {
          if (dist(draft, sp) > 0.05) addWall(draft, sp)
        } else {
          const origin = { x: Math.min(draft.x, sp.x), y: Math.min(draft.y, sp.y) }
          addSlab(origin, Math.abs(sp.x - draft.x), Math.abs(sp.y - draft.y))
        }
        setDraft(null)
      }
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const w = pointerWorld(e)
    setCursor(snapVec(w, GRID))
    if (panRef.current) {
      setOffset({ x: panRef.current.ox + (e.clientX - panRef.current.x), y: panRef.current.oy + (e.clientY - panRef.current.y) })
    }
  }

  function onPointerUp() {
    panRef.current = null
  }

  function pickElement(p: Vec2): Element | null {
    // الأعمدة
    for (const e of levelElements) {
      if (e.kind === 'column' && Math.abs(p.x - e.at.x) < e.width / 2 + 0.15 && Math.abs(p.y - e.at.y) < e.depth / 2 + 0.15) return e
    }
    // الجدران
    let best: { e: Element; d: number } | null = null
    for (const w of walls) {
      const r = closestOnSegment(p, w.a, w.b)
      if (r.distance < (w.thickness / 2 + 0.2) && (!best || r.distance < best.d)) best = { e: w, d: r.distance }
    }
    if (best) return best.e
    // الأرضيات
    for (const e of levelElements) {
      if (e.kind === 'slab' && p.x >= e.origin.x && p.x <= e.origin.x + e.width && p.y >= e.origin.y && p.y <= e.origin.y + e.depth) return e
    }
    return null
  }

  function zoom(dir: number) {
    setScale((s) => Math.max(12, Math.min(160, s * (dir > 0 ? 1.2 : 1 / 1.2))))
  }

  // رسم الشبكة
  const gridStep = scale * (scale < 28 ? 4 : 1) // كل متر أو كل 4 أمتار
  const gridLines: JSX.Element[] = []
  const startX = ((ox % gridStep) + gridStep) % gridStep
  const startY = ((oy % gridStep) + gridStep) % gridStep
  for (let x = startX; x < size.w; x += gridStep) gridLines.push(<line key={'gx' + x} x1={x} y1={0} x2={x} y2={size.h} stroke="#16223a" strokeWidth={1} />)
  for (let y = startY; y < size.h; y += gridStep) gridLines.push(<line key={'gy' + y} x1={0} y1={y} x2={size.w} y2={y} stroke="#16223a" strokeWidth={1} />)

  const svgStyle: React.CSSProperties = {
    display: 'block',
    cursor: tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair',
  }

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-ink touch-none select-none">
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={svgStyle}
      >
        {gridLines}
        {/* المحاور */}
        <line x1={ox} y1={0} x2={ox} y2={size.h} stroke="#27406488" strokeWidth={1.5} />
        <line x1={0} y1={oy} x2={size.w} y2={oy} stroke="#27406488" strokeWidth={1.5} />

        {/* الأرضيات */}
        {levelElements.filter((e) => e.kind === 'slab').map((e: any) => {
          const p1 = worldToScreen({ x: e.origin.x, y: e.origin.y + e.depth })
          return (
            <rect key={e.id} x={p1.x} y={p1.y} width={e.width * scale} height={e.depth * scale}
              fill={selectedId === e.id ? '#2563eb33' : '#1b2a45aa'} stroke={selectedId === e.id ? '#60a5fa' : '#34507e'} strokeWidth={1.5} />
          )
        })}

        {/* الجدران */}
        {walls.map((w) => {
          const a = worldToScreen(w.a)
          const b = worldToScreen(w.b)
          const isSel = selectedId === w.id
          return (
            <g key={w.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isSel ? '#60a5fa' : '#cbd5e1'} strokeWidth={Math.max(3, w.thickness * scale)} strokeLinecap="round" />
            </g>
          )
        })}

        {/* الفتحات */}
        {levelElements.filter((e) => e.kind === 'door' || e.kind === 'window').map((o: any) => {
          const host = walls.find((w) => w.id === o.hostId)
          if (!host) return null
          const c = { x: host.a.x + (host.b.x - host.a.x) * o.t, y: host.a.y + (host.b.y - host.a.y) * o.t }
          const p = worldToScreen(c)
          const isSel = selectedId === o.id
          return <circle key={o.id} cx={p.x} cy={p.y} r={7} fill={o.kind === 'window' ? '#7fc7e6' : '#f59e0b'} stroke={isSel ? '#fff' : '#0a0e1a'} strokeWidth={isSel ? 2.5 : 1.5} />
        })}

        {/* الأعمدة */}
        {levelElements.filter((e) => e.kind === 'column').map((e: any) => {
          const p = worldToScreen({ x: e.at.x - e.width / 2, y: e.at.y + e.depth / 2 })
          const isSel = selectedId === e.id
          return <rect key={e.id} x={p.x} y={p.y} width={e.width * scale} height={e.depth * scale} fill={isSel ? '#60a5fa' : '#94a3b8'} stroke="#0a0e1a" strokeWidth={1} />
        })}

        {/* نقطة البداية (رسم) */}
        {draft && (() => { const p = worldToScreen(draft); return <circle cx={p.x} cy={p.y} r={5} fill="#22c55e" /> })()}
        {/* خط المعاينة */}
        {draft && cursor && (tool === 'wall' || tool === 'slab') && (() => {
          const a = worldToScreen(draft); const b = worldToScreen(cursor)
          if (tool === 'slab') {
            const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y)
            return <rect x={x} y={y} width={Math.abs(b.x - a.x)} height={Math.abs(b.y - a.y)} fill="#22c55e22" stroke="#22c55e" strokeDasharray="4 4" />
          }
          return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" />
        })()}
        {/* مؤشر الماوس */}
        {cursor && tool !== 'select' && tool !== 'pan' && (() => { const p = worldToScreen(cursor); return <circle cx={p.x} cy={p.y} r={3.5} fill="#22c55e" opacity={0.8} /> })()}
      </svg>

      {/* أدوات التكبير + القياس */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-2">
        <button onClick={() => zoom(1)} className="w-9 h-9 rounded-lg bg-panel border border-edge text-lg">+</button>
        <button onClick={() => zoom(-1)} className="w-9 h-9 rounded-lg bg-panel border border-edge text-lg">−</button>
        <button onClick={() => { setOffset({ x: 0, y: 0 }); setScale(48) }} className="w-9 h-9 rounded-lg bg-panel border border-edge text-[10px]">وسط</button>
      </div>
      {cursor && (
        <div className="absolute bottom-3 right-3 text-[11px] text-slate-400 bg-panel/80 border border-edge rounded-lg px-2 py-1 tabular-nums">
          X {cursor.x.toFixed(2)} · Y {cursor.y.toFixed(2)} م
          {draft && (tool === 'wall') && <> · طول {dist(draft, cursor).toFixed(2)}م</>}
        </div>
      )}
      {(tool === 'wall' || tool === 'slab') && draft && (
        <div className="absolute top-3 right-3 text-[11px] text-emerald-300 bg-panel/80 border border-edge rounded-lg px-2 py-1">
          {tool === 'wall' ? 'انقر لتحديد نهاية الجدار' : 'انقر لتحديد الركن المقابل'}
        </div>
      )}
    </div>
  )
}
