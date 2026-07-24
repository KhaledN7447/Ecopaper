'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle, Recycle, Brain } from 'lucide-react'
import {
  groupMonthlyByDepartment, forecastNext, bestCollectionDay, recommendPartner,
  type PartnerLite,
} from '@/lib/insights'

const PAPER_TYPE_LABEL: Record<string, string> = {
  mixed: 'ورق مختلط', shredded: 'ورق مقطوع', cardboard: 'كرتون', confidential: 'وثائق سرية',
}
const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus }
const TREND_COLOR = { up: 'text-red-600 bg-red-50', down: 'text-green-600 bg-green-50', flat: 'text-gray-500 bg-gray-50' }
const TREND_LABEL = { up: 'تصاعدي', down: 'تنازلي', flat: 'مستقر' }
const CONF_LABEL = { high: 'ثقة عالية', medium: 'ثقة متوسطة', low: 'ثقة منخفضة (بيانات قليلة)' }

interface DeptForecast {
  department_id: string
  department_name: string
  forecast: number
  trend: 'up' | 'down' | 'flat'
  confidence: 'low' | 'medium' | 'high'
  monthsUsed: number
  bestDay: { day: string; count: number; pct: number } | null
}

export default function AIInsightsPage() {
  const [loading, setLoading] = useState(true)
  const [deptForecasts, setDeptForecasts] = useState<DeptForecast[]>([])
  const [riskItems, setRiskItems] = useState<any[]>([])
  const [partnerRec, setPartnerRec] = useState<{ partner: PartnerLite; score: number } | null>(null)
  const [dominantType, setDominantType] = useState<string>('mixed')
  const [totalActiveWeight, setTotalActiveWeight] = useState(0)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiSummaryState, setAiSummaryState] = useState<'idle' | 'loading' | 'unavailable'>('idle')

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()

    const [{ data: requests }, { data: warehouse }, { data: partners }] = await Promise.all([
      supabase.from('requests_with_details').select('*'),
      supabase.from('warehouse_items').select('*').eq('status', 'active'),
      supabase.from('partners').select('*'),
    ])

    // ── Predictive: monthly forecast per department ──
    const rows = (requests ?? []).map((r: any) => ({
      department_id: r.department_id,
      created_at: r.created_at,
      weight: Number(r.actual_weight ?? r.estimated_weight ?? 0),
    }))
    const monthlyByDept = groupMonthlyByDepartment(rows)

    const deptNames: Record<string, string> = {}
    ;(requests ?? []).forEach((r: any) => { deptNames[r.department_id] = r.department_name })

    const forecasts: DeptForecast[] = Object.entries(monthlyByDept).map(([deptId, points]) => {
      const f = forecastNext(points)
      const dates = (requests ?? []).filter((r: any) => r.department_id === deptId).map((r: any) => r.created_at)
      return {
        department_id: deptId,
        department_name: deptNames[deptId] ?? 'قسم غير معروف',
        ...f,
        bestDay: bestCollectionDay(dates),
      }
    }).sort((a, b) => b.forecast - a.forecast)

    setDeptForecasts(forecasts)

    // ── Risk alerts: warehouse batches nearing destruction/retention deadline ──
    const risks = (warehouse ?? []).map((w: any) => {
      const deposit = new Date(w.deposit_date)
      const destroyDate = new Date(deposit)
      destroyDate.setFullYear(destroyDate.getFullYear() + w.retention_years)
      const days = Math.ceil((destroyDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return { ...w, daysLeft: days }
    }).filter((w: any) => w.daysLeft <= 30).sort((a: any, b: any) => a.daysLeft - b.daysLeft)
    setRiskItems(risks)

    // ── Prescriptive: recommended partner for current warehouse stock ──
    const weight = (warehouse ?? []).reduce((s: number, w: any) => s + Number(w.weight), 0)
    setTotalActiveWeight(weight)
    const typeCounts: Record<string, number> = {}
    ;(warehouse ?? []).forEach((w: any) => { typeCounts[w.paper_type] = (typeCounts[w.paper_type] ?? 0) + 1 })
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'mixed'
    setDominantType(topType)
    if (weight > 0) setPartnerRec(recommendPartner(topType, partners ?? []))

    setLoading(false)
  }

  async function getAiSummary() {
    setAiSummaryState('loading')
    try {
      const res = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          topDepartments: deptForecasts.slice(0, 3),
          riskItemsCount: riskItems.length,
          totalActiveWeight,
          partnerRecommendation: partnerRec?.partner.name ?? null,
        }),
      })
      const data = await res.json()
      if (data.summary) { setAiSummary(data.summary); setAiSummaryState('idle') }
      else { setAiSummaryState('unavailable') }
    } catch {
      setAiSummaryState('unavailable')
    }
  }

  if (loading) return <div className="p-6 text-center text-green-600 text-sm">جارٍ تحليل البيانات...</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" /> التوقعات والتوصيات الذكية
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">تحليل تنبؤي وتوجيهي مبني على بيانات المنصة الفعلية</p>
      </div>

      {/* Optional AI narrative */}
      <div className="bg-gradient-to-l from-purple-50 to-white rounded-2xl border border-purple-100 p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">ملخص ذكي (اختياري)</p>
              {aiSummary ? (
                <p className="text-sm text-gray-600 leading-relaxed">{aiSummary}</p>
              ) : aiSummaryState === 'unavailable' ? (
                <p className="text-xs text-gray-400">هذه الميزة تحتاج تفعيل مفتاح Anthropic API من إعدادات المشروع.</p>
              ) : (
                <p className="text-xs text-gray-400">اضغط الزر لتوليد ملخص عربي مبني على التحليل أدناه.</p>
              )}
            </div>
          </div>
          {!aiSummary && (
            <button onClick={getAiSummary} disabled={aiSummaryState === 'loading'}
              className="flex-shrink-0 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50 transition-all">
              {aiSummaryState === 'loading' ? 'جارٍ التوليد...' : 'توليد ملخص'}
            </button>
          )}
        </div>
      </div>

      {/* Risk alerts */}
      {riskItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-4 h-4" /> تنبيهات تحتاج إجراء ({riskItems.length})
          </p>
          <div className="space-y-1.5">
            {riskItems.slice(0, 5).map(w => (
              <p key={w.id} className="text-xs text-amber-700">
                دفعة {PAPER_TYPE_LABEL[w.paper_type]} ({w.weight} كجم) —{' '}
                {w.daysLeft <= 0 ? 'جاهزة للإتلاف الآن' : `متبقي ${w.daysLeft} يوم على موعد الإتلاف`}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Predictive: department forecasts */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4" /> التنبؤ بالإنتاج القادم لكل قسم
        </h2>
        {deptForecasts.length === 0 ? (
          <p className="text-xs text-gray-400">لا توجد بيانات كافية بعد لبناء توقعات — تحتاج تراكم طلبات عبر أشهر متعددة.</p>
        ) : (
          <div className="grid gap-3">
            {deptForecasts.slice(0, 6).map(d => {
              const TrendIcon = TREND_ICON[d.trend]
              return (
                <div key={d.department_id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{d.department_name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {CONF_LABEL[d.confidence]} · بناءً على {d.monthsUsed} {d.monthsUsed === 1 ? 'شهر' : 'أشهر'}
                      {d.bestDay && <> · أفضل يوم للجمع: {d.bestDay.day}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-left">
                      <p className="font-bold text-gray-800 text-sm">{d.forecast} كجم</p>
                      <p className="text-[10px] text-gray-400">الشهر القادم (متوقع)</p>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${TREND_COLOR[d.trend]}`}>
                      <TrendIcon className="w-3 h-3" /> {TREND_LABEL[d.trend]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Prescriptive: partner recommendation */}
      {partnerRec && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-green-800 flex items-center gap-1.5 mb-1.5">
            <Recycle className="w-4 h-4" /> توصية: أفضل شريك للمخزون الحالي
          </p>
          <p className="text-xs text-green-700">
            لديكم <strong>{totalActiveWeight.toFixed(1)} كجم</strong> بالمستودع، أغلبها{' '}
            <strong>{PAPER_TYPE_LABEL[dominantType]}</strong>. الشريك الأنسب حالياً هو{' '}
            <strong>{partnerRec.partner.name}</strong> بناءً على قدرته على الشراء والاستلام من الموقع ومطابقة المواد المقبولة.
          </p>
        </div>
      )}
    </div>
  )

}
