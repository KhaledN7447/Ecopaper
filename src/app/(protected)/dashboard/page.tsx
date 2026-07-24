'use client'

import { useEffect, useState } from 'react'
import { Package, CheckCircle, TreePine, Wind } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import StatCard from '@/components/stat-card'
import StatusBadge from '@/components/status-badge'
import { PAPER_TYPES, sumActualWeight, toTrees, toCO2tons } from '@/lib/utils'
import DashboardCharts from './charts'

export default function DashboardPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('requests_with_details').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setRequests(data ?? []); setLoading(false) })
  }, [])

  const totalKg   = sumActualWeight(requests)
  const completed = requests.filter(r => r.status === 'completed').length
  const pending   = requests.filter(r => r.status === 'pending').length

  if (loading) return <div className="flex h-full items-center justify-center"><div className="text-green-600 text-sm">جارٍ التحميل...</div></div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">لوحة التحكم</h1>
        <p className="text-gray-400 text-sm mt-0.5">مؤشرات إعادة تدوير الورق</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="ورق مجمع"       value={totalKg.toFixed(1)} unit="كجم"  Icon={Package}    iconBg="bg-green-500"   sub="↑ 12% هذا الشهر" />
        <StatCard label="طلبات مكتملة"   value={completed}           unit="طلب"  Icon={CheckCircle} iconBg="bg-blue-500"    sub={`${pending} منتظرة`} />
        <StatCard label="أشجار محفوظة"   value={toTrees(totalKg)}    unit="شجرة" Icon={TreePine}    iconBg="bg-emerald-600" sub="تقديرياً" />
        <StatCard label="CO₂ تم تقليله" value={toCO2tons(totalKg)}  unit="طن"   Icon={Wind}        iconBg="bg-teal-500"    sub="تقديرياً" />
      </div>

      <DashboardCharts />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-5">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">أحدث الطلبات</p>
        </div>
        {requests.slice(0, 8).map((r: any) => (
          <div key={r.id} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-800">{r.department_name}</p>
              <p className="text-xs text-gray-400">{r.building} · {PAPER_TYPES[r.paper_type as keyof typeof PAPER_TYPES]}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{r.estimated_weight} كجم</span>
              <StatusBadge status={r.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
