'use client'

import { useEffect, useState } from 'react'
import { TreePine, Wind } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PAPER_TYPES, sumActualWeight, toTrees, toCO2tons } from '@/lib/utils'
import AnalyticsCharts from './charts'

export default function AnalyticsPage() {
  const [requests, setRequests] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('requests_with_details').select('*').then(({ data }) => setRequests(data ?? []))
  }, [])

  const totalKg = sumActualWeight(requests)
  const byType  = Object.entries(PAPER_TYPES).map(([key, label]) => ({
    key, label,
    count: requests.filter(r => r.paper_type === key).length,
    pct:   Math.round((requests.filter(r => r.paper_type === key).length / Math.max(requests.length, 1)) * 100),
  }))
  const typeColors: Record<string, string> = { mixed:'#16A34A', shredded:'#2563EB', cardboard:'#D97706', confidential:'#7C3AED' }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">التحليلات</h1>
        <p className="text-gray-400 text-sm mt-0.5">نظرة شاملة على أداء إعادة التدوير</p>
      </div>
      <AnalyticsCharts />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-4">توزيع أنواع الورق</p>
          <div className="space-y-3">
            {byType.map(({ key, label, count, pct }) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700 font-medium">{label}</span>
                  <span className="text-gray-400">{count} طلبات · {pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width:`${pct}%`, background:typeColors[key] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-4">الأثر البيئي الإجمالي</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-2xl p-5 text-center">
              <TreePine className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-green-700">{toTrees(totalKg)}</p>
              <p className="text-sm text-green-600 mt-1">شجرة محفوظة</p>
            </div>
            <div className="bg-teal-50 rounded-2xl p-5 text-center">
              <Wind className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-teal-700">{toCO2tons(totalKg)}</p>
              <p className="text-sm text-teal-600 mt-1">طن CO₂ مقلص</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-400">
            <p>📐 1 شجرة = 40 كجم ورق مُعاد تدويره</p>
            <p>🌿 1 كجم ورق = 3.3 كجم CO₂ مُقلَّص</p>
          </div>
        </div>
      </div>
    </div>
  )
}
