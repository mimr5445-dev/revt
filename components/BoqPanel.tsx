'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import type { BoqResult } from '@/lib/types'
import { computeBoq } from '@/lib/boq'
import { downloadText } from '@/lib/revt-file'

export default function BoqPanel() {
  const project = useStore((s) => s.project)
  const [result, setResult] = useState<BoqResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')

  async function analyze() {
    setLoading(true)
    setInfo('')
    try {
      const res = await fetch('/api/cloud/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      })
      const data = await res.json()
      if (data?.ok) {
        setResult(data.result as BoqResult)
        setInfo('معالج سحابي · ' + data.computeMs + ' مللي ثانية')
      } else throw new Error(data?.error || 'فشل التحليل')
    } catch (e: any) {
      // احتياطي محلي
      setResult(computeBoq(project))
      setInfo('تم الحساب محليًا (تعذّر الاتصال بالمعالج السحابي)')
    } finally {
      setLoading(false)
    }
  }

  function exportCsv() {
    const r = result ?? computeBoq(project)
    const rows = [['الفئة', 'البند', 'الكمية', 'الوحدة']]
    for (const l of r.lines) rows.push([l.category, l.item, String(l.quantity), l.unit])
    const csv = '\uFEFF' + rows.map((row) => row.map((c) => '"' + c.replace(/"/g, '""') + '"').join(',')).join('\n')
    downloadText((project.name || 'revt') + '-BOQ.csv', csv, 'text/csv')
  }

  const t = result?.totals

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-200 text-sm">⚡ المعالج السحابي — الكميات</h3>
        <div className="flex gap-1.5">
          <button onClick={analyze} disabled={loading} className="text-[12px] px-3 py-1.5 rounded-lg bg-sky-500 text-white font-bold disabled:opacity-50">
            {loading ? '…يحسب' : 'تحليل'}
          </button>
          {result && <button onClick={exportCsv} className="text-[12px] px-2 py-1.5 rounded-lg bg-white/5 text-slate-300">CSV</button>}
        </div>
      </div>

      {info && <div className="text-[11px] text-emerald-400/80 mb-2">{info}</div>}

      {!result && <div className="text-center text-[13px] text-slate-500 py-6">اضغط «تحليل» لإرسال النموذج إلى المعالج السحابي واستخراج جدول الكميات.</div>}

      {result && t && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="مساحة الجدران" value={t.wallArea + ' م²'} />
            <Stat label="مساحة الأرضيات" value={t.slabArea + ' م²'} />
            <Stat label="حجم الخرسانة" value={t.concreteVolume + ' م³'} />
            <Stat label="الوزن التقديري" value={(t.totalWeight / 1000).toFixed(1) + ' طن'} />
          </div>
          <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-center">
            <div className="text-[11px] text-slate-400">التكلفة التقديرية</div>
            <div className="text-xl font-extrabold text-sky-300 tabular-nums">{t.estimatedCost.toLocaleString()} {t.currency}</div>
          </div>

          <table className="w-full text-[12px]">
            <thead><tr className="text-slate-500 text-right"><th className="font-medium py-1">البند</th><th className="font-medium">الكمية</th></tr></thead>
            <tbody>
              {result.lines.map((l, i) => (
                <tr key={i} className="border-t border-edge/50">
                  <td className="py-1.5 text-slate-300">{l.item}</td>
                  <td className="text-slate-100 tabular-nums">{l.quantity} {l.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-edge bg-white/[0.03] p-2.5">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-100 tabular-nums">{value}</div>
    </div>
  )
}
