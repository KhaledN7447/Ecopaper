'use client'

import { useState, useEffect, useTransition } from 'react'
import { AlertCircle, Shield, ClipboardList, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from '@/components/status-badge'
import VerificationModal from '@/components/verification/verification-modal'
import { PAPER_TYPES } from '@/lib/utils'
import type { PickupRequest, Status } from '@/types'

const TABS: { id: string; label: string; statuses: Status[] }[] = [
  { id: 'pending',   label: 'انتظار',  statuses: ['pending']                },
  { id: 'active',    label: 'نشطة',    statuses: ['assigned','in_progress'] },
  { id: 'completed', label: 'مكتملة',  statuses: ['completed']              },
]

export default function QueuePage() {
  const [requests,  setRequests]  = useState<PickupRequest[]>([])
  const [tab,       setTab]       = useState('pending')
  const [verifying, setVerifying] = useState<PickupRequest | null>(null)
  const [userId,    setUserId]    = useState<string | null>(null)
  const [pending,   start]        = useTransition()

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const { data } = await supabase
        .from('requests_with_details')
        .select('*')
        .order('priority',   { ascending: false })
        .order('building',   { ascending: true  })
        .order('created_at', { ascending: true  })
      setRequests((data as any[]) ?? [])
    }
    load()

    // Realtime subscription
    const channel = supabase
      .channel('queue-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pickup_requests' }, load)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const curTab   = TABS.find(t => t.id === tab)!
  const filtered = requests.filter(r => curTab.statuses.includes(r.status as Status))

  async function handleAccept(id: string) {
    if (!userId) return
    start(async () => {
      const supabase = createClient()
      await supabase
        .from('pickup_requests')
        .update({ status: 'in_progress', assigned_to: userId })
        .eq('id', id)
      // log
      await supabase.from('request_logs').insert({ request_id: id, action: 'accepted', performed_by: userId })
      setRequests(p => p.map(r => r.id === id ? { ...r, status: 'in_progress', assigned_to: userId } : r))
    })
  }

  async function handleComplete(id: string, weight: number, notes: string, file: File | null) {
    if (!userId) return
    start(async () => {
      const supabase = createClient()
      let proof_image_url: string | null = null

      if (file) {
        const ext  = file.name.split('.').pop()
        const path = `${id}/${Date.now()}.${ext}`
        await supabase.storage.from('proof-images').upload(path, file)
        const { data: urlData } = supabase.storage.from('proof-images').getPublicUrl(path)
        proof_image_url = urlData.publicUrl
      }

      await supabase.from('pickup_requests').update({
        status:          'completed',
        actual_weight:   weight,
        notes:           notes || null,
        proof_image_url,
        completed_at:    new Date().toISOString(),
      }).eq('id', id)

      await supabase.from('request_logs').insert({ request_id: id, action: 'completed', performed_by: userId })

      setRequests(p => p.map(r => r.id === id
        ? { ...r, status: 'completed', actual_weight: weight, completed_at: new Date().toISOString() }
        : r
      ))
      setVerifying(null)
    })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">قائمة المهام</h1>
        <p className="text-gray-400 text-sm mt-0.5">مرتبة: أولوية → موقع → وقت</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5 w-fit">
        {TABS.map(t => {
          const cnt = requests.filter(r => t.statuses.includes(r.status as Status)).length
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                ${tab === t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {t.label}
              <span className={`mr-1.5 text-xs px-1.5 py-0.5 rounded-full
                ${tab === t.id ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-400'}`}>
                {cnt}
              </span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-300">
          <ClipboardList className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">لا توجد مهام في هذه الفئة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className={`bg-white rounded-xl p-4 shadow-sm border transition-all
              ${r.priority === 'urgent' ? 'border-red-200 bg-red-50/20' : 'border-gray-100'}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="text-xs font-mono text-gray-300">{r.id.slice(0,8).toUpperCase()}</span>
                    {r.priority === 'urgent' &&
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" />عاجل
                      </span>}
                    {r.secure_disposal &&
                      <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Shield className="w-3 h-3" />سري
                      </span>}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                    <span className="text-gray-500">القسم: <strong className="text-gray-800">{r.department_name}</strong></span>
                    <span className="text-gray-500">الموقع: <strong className="text-gray-800">{r.building}{r.floor ? ` · ${r.floor}` : ''}</strong></span>
                    <span className="text-gray-500">النوع: <strong className="text-gray-800">{PAPER_TYPES[r.paper_type as keyof typeof PAPER_TYPES]}</strong></span>
                    <span className="text-gray-500">الكمية: <strong className="text-gray-800">~{r.estimated_weight} كجم</strong></span>
                  </div>
                  {r.notes && <p className="text-xs text-gray-400 mt-2 bg-gray-50 px-2 py-1 rounded-lg line-clamp-1">{r.notes}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <StatusBadge status={r.status} />
                  {r.status === 'pending' && (
                    <button onClick={() => handleAccept(r.id)} disabled={pending}
                      className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium disabled:opacity-50">
                      قبول
                    </button>
                  )}
                  {['assigned','in_progress'].includes(r.status) && (
                    <button onClick={() => setVerifying(r)}
                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium flex items-center gap-1">
                      <Upload className="w-3 h-3" />تحقق
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {verifying && (
        <VerificationModal
          request={verifying}
          onComplete={handleComplete}
          onClose={() => setVerifying(null)}
        />
      )}
    </div>
  )
}
