// src/lib/insights.ts
// طبقة التحليل التنبؤي والتوجيهي (Predictive & Prescriptive Analysis)
// إحصائي بالكامل — لا يحتاج أي خدمة خارجية أو مفتاح API.

export interface MonthlyPoint {
  month: string // 'YYYY-MM'
  total: number
}

export interface Forecast {
  forecast: number
  trend: 'up' | 'down' | 'flat'
  confidence: 'low' | 'medium' | 'high'
  monthsUsed: number
}

/**
 * توقع القيمة القادمة عبر انحدار خطي بسيط (Ordinary Least Squares)
 * على سلسلة زمنية شهرية. هذا هو جوهر "Predictive Analysis".
 */
export function forecastNext(points: MonthlyPoint[]): Forecast {
  const n = points.length
  if (n === 0) return { forecast: 0, trend: 'flat', confidence: 'low', monthsUsed: 0 }
  if (n === 1) return { forecast: points[0].total, trend: 'flat', confidence: 'low', monthsUsed: 1 }

  const xs = points.map((_, i) => i)
  const ys = points.map(p => p.total)
  const xMean = xs.reduce((a, b) => a + b, 0) / n
  const yMean = ys.reduce((a, b) => a + b, 0) / n

  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean)
    den += (xs[i] - xMean) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  const intercept = yMean - slope * xMean
  const forecast = Math.max(0, Math.round(slope * n + intercept))

  const trend: Forecast['trend'] = slope > yMean * 0.05 ? 'up' : slope < -yMean * 0.05 ? 'down' : 'flat'
  const confidence: Forecast['confidence'] = n >= 6 ? 'high' : n >= 3 ? 'medium' : 'low'

  return { forecast, trend, confidence, monthsUsed: n }
}

/** يجمع مصفوفة {created_at, weight, department_id} إلى نقاط شهرية لكل قسم */
export function groupMonthlyByDepartment(
  rows: { department_id: string; created_at: string; weight: number }[]
): Record<string, MonthlyPoint[]> {
  const byDept: Record<string, Record<string, number>> = {}
  for (const row of rows) {
    const month = row.created_at.slice(0, 7) // YYYY-MM
    byDept[row.department_id] ??= {}
    byDept[row.department_id][month] = (byDept[row.department_id][month] ?? 0) + row.weight
  }
  const result: Record<string, MonthlyPoint[]> = {}
  for (const [deptId, months] of Object.entries(byDept)) {
    result[deptId] = Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total: Math.round(total) }))
  }
  return result
}

const DAY_NAMES_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

/** أفضل يوم أسبوعي لجدولة الجمع، بناءً على تكرار الطلبات التاريخية — جزء من "Prescriptive Analysis" */
export function bestCollectionDay(dates: string[]): { day: string; count: number; pct: number } | null {
  if (dates.length === 0) return null
  const counts = new Array(7).fill(0)
  dates.forEach(d => counts[new Date(d).getDay()]++)
  const maxIdx = counts.indexOf(Math.max(...counts))
  return { day: DAY_NAMES_AR[maxIdx], count: counts[maxIdx], pct: Math.round((counts[maxIdx] / dates.length) * 100) }
}

export interface PartnerLite {
  id: string
  name: string
  buys_paper: string | null
  pickup_from_site: boolean
  accepted_materials: string[]
  is_regulatory: boolean
}

const MATERIAL_MAP: Record<string, string[]> = {
  mixed: ['ورق أبيض', 'جرائد', 'مجلات'],
  shredded: ['ورق أبيض'],
  cardboard: ['كرتون'],
  confidential: [],
}

/** يوصي بأنسب شريك تدوير لدفعة معينة حسب نوع الورق وقدرة الشريك — محرك قواعد (Rule-based) */
export function recommendPartner(paperType: string, partners: PartnerLite[]): { partner: PartnerLite; score: number } | null {
  const candidates = partners.filter(p => !p.is_regulatory && p.buys_paper !== 'no')
  if (candidates.length === 0) return null

  const scored = candidates.map(p => {
    let score = 0
    if (p.buys_paper === 'yes') score += 3
    else if (p.buys_paper === 'depends') score += 1
    if (p.pickup_from_site) score += 2
    if (p.accepted_materials?.some(m => (MATERIAL_MAP[paperType] || []).includes(m))) score += 2
    return { partner: p, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0]
}
