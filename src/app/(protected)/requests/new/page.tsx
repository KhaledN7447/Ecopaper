'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BUILDINGS, FLOORS, PAPER_TYPES } from '@/lib/utils'
import type { PaperType, Priority } from '@/types'

export default function NewRequestPage() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState('')

  const [building,  setBuilding]  = useState('')
  const [floor,     setFloor]     = useState('')
  const [paperType, setPaperType] = useState<PaperType>('mixed')
  const [weight,    setWeight]    = useState('')
  const [priority,  setPriority]  = useState<Priority>('normal')
  const [secure,    setSecure]    = useState(false)
  const [notes,     setNotes]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!building || !weight) { setError('يرجى ملء الحقول الإلزامية'); return }

    start(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('انتهت الجلسة، يرجى تسجيل الدخول'); return }

      const { data: profile } = await supabase
        .from('profiles').select('department_id').eq('id', user.id).single()

      const { error: insertErr } = await supabase.from('pickup_requests').insert({
        department_id:    profile?.department_id,
        building,
        floor:            floor || null,
        paper_type:       paperType,
        estimated_weight: parseFloat(weight),
        priority,
        secure_disposal:  secure,
        notes:            notes || null,
        created_by:       user.id,
        status:           'pending',
      })

      if (insertErr) { setError(insertErr.message); return }

      // Log the action
      router.push('/requests')
      router.refresh()
    })
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowRight className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">طلب جمع جديد</h1>
          <p className="text-gray-400 text-sm">أملأ التفاصيل أدناه</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        {/* Building + Floor */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">المبنى *</label>
            <select value={building} onChange={e => setBuilding(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white">
              <option value="">اختر</option>
              {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">الطابق</label>
            <select value={floor} onChange={e => setFloor(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white">
              <option value="">اختر</option>
              {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Paper type */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-2">نوع الورق</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(PAPER_TYPES) as [PaperType, string][]).map(([k, v]) => (
              <button key={k} type="button" onClick={() => setPaperType(k)}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all
                  ${paperType === k ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Weight */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">الكمية التقريبية (كجم) *</label>
          <input type="number" step="0.5" min="0.5" value={weight} onChange={e => setWeight(e.target.value)} required
            placeholder="مثال: 20"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
        </div>

        {/* Priority */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-2">الأولوية</label>
          <div className="flex gap-2">
            {([['normal','عادية'],['urgent','⚡ عاجل']] as [Priority, string][]).map(([k,v]) => (
              <button key={k} type="button" onClick={() => setPriority(k)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all
                  ${priority === k
                    ? (k === 'urgent' ? 'border-red-500 bg-red-50 text-red-700' : 'border-green-500 bg-green-50 text-green-700')
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Secure disposal */}
        <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all
          ${secure ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}>
          <input type="checkbox" checked={secure} onChange={e => setSecure(e.target.checked)}
            className="w-4 h-4 accent-purple-600" />
          <Shield className={`w-4 h-4 ${secure ? 'text-purple-600' : 'text-gray-400'}`} />
          <span className="text-sm text-gray-700">تدمير آمن (وثائق سرية)</span>
        </label>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">ملاحظات (اختياري)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="أي تفاصيل إضافية..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={pending}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold text-sm
                       hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {pending ? 'جارٍ الإرسال...' : 'رفع الطلب'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}
