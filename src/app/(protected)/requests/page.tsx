'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import RequestCard from '@/components/requests/request-card'

export default function RequestsPage() {
  const [requests,   setRequests]   = useState<any[]>([])
  const [profile,    setProfile]    = useState<any>(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('profiles').select('*, departments(name)').eq('id', user.id).single()
      setProfile(prof)
      const { data: reqs } = await supabase
        .from('requests_with_details').select('*')
        .eq('department_id', prof?.department_id ?? '')
        .order('created_at', { ascending: false })
      setRequests(reqs ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const counts = {
    pending:     requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => ['assigned','in_progress'].includes(r.status)).length,
    completed:   requests.filter(r => r.status === 'completed').length,
  }

  if (loading) return <div className="flex h-full items-center justify-center"><div className="text-green-600 text-sm">جارٍ التحميل...</div></div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">طلباتي</h1>
          <p className="text-gray-400 text-sm">{profile?.departments?.name}</p>
        </div>
        <Link href="/requests/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" />طلب جديد
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[{ label:'انتظار', count:counts.pending },{ label:'جارٍ', count:counts.in_progress },{ label:'مكتمل', count:counts.completed }].map(({ label, count }) => (
          <div key={label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-800">{count}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20 text-gray-300">
          <FileText className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">لا توجد طلبات بعد</p>
          <Link href="/requests/new" className="mt-3 inline-block text-sm text-green-600 hover:underline">أنشئ أول طلب</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => <RequestCard key={r.id} r={r} />)}
        </div>
      )}
    </div>
  )
}
