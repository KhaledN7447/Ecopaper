'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Recycle, Building2, Phone, Mail, Globe, MapPin, CheckCircle2, XCircle,
  Download, ClipboardList, X, ExternalLink, ShieldCheck,
} from 'lucide-react'

interface Partner {
  id: string
  name: string
  type: string
  description: string | null
  services: string[]
  accepted_materials: string[]
  city: string | null
  phone: string | null
  mobile: string | null
  email: string | null
  website: string | null
  buys_paper: string | null
  pickup_from_site: boolean
  min_quantity: string | null
  issues_certificate: string | null
  is_regulatory: boolean
  status: string
}

interface PartnerRequest {
  id: string
  partner_id: string
  available_weight: number
  paper_types: string[]
  notes: string | null
  status: string
  created_at: string
  partners?: { name: string }
}

const TYPE_LABEL: Record<string, string> = {
  recycling_company: 'شركة إعادة تدوير',
  charity: 'جهة وقفية / خيرية',
  waste_management: 'شركة إدارة نفايات',
  regulatory: 'جهة تنظيمية',
}

const TRI_LABEL: Record<string, string> = { yes: '✅ نعم', no: '❌ لا', depends: '⚠️ حسب الخدمة' }

const REQUEST_STATUS_LABEL: Record<string, string> = {
  pending: 'بانتظار المتابعة',
  contacted: 'تم التواصل',
  scheduled: 'مجدول للاستلام',
  completed: 'مكتمل',
  cancelled: 'ملغي',
}
const REQUEST_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  contacted: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [requests, setRequests] = useState<PartnerRequest[]>([])
  const [totalActiveWeight, setTotalActiveWeight] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'partners' | 'requests'>('partners')
  const [modalPartner, setModalPartner] = useState<Partner | null>(null)
  const [role, setRole] = useState<string>('facility_staff')

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile) setRole(profile.role)
    }

    const [{ data: p }, { data: r }, { data: w }] = await Promise.all([
      supabase.from('partners').select('*').order('is_regulatory').order('name'),
      supabase.from('partner_pickup_requests').select('*, partners(name)').order('created_at', { ascending: false }),
      supabase.from('warehouse_items').select('weight').eq('status', 'active'),
    ])

    setPartners(p ?? [])
    setRequests(r ?? [])
    setTotalActiveWeight((w ?? []).reduce((sum, i) => sum + Number(i.weight), 0))
    setLoading(false)
  }

  function downloadReport() {
    const header = ['الشريك', 'الوزن (كجم)', 'أنواع الورق', 'الحالة', 'تاريخ الطلب', 'ملاحظات']
    const rows = requests.map(r => [
      r.partners?.name ?? '', r.available_weight, (r.paper_types || []).join(' / '),
      REQUEST_STATUS_LABEL[r.status] ?? r.status,
      new Date(r.created_at).toLocaleDateString('ar-SA'), r.notes ?? '',
    ])
    const csv = '\uFEFF' + [header, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `تقرير-طلبات-الاستلام-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activePartners = partners.filter(p => !p.is_regulatory)
  const regulatoryPartners = partners.filter(p => p.is_regulatory)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">شركاء التدوير والتخلص الآمن</h1>
          <p className="text-gray-400 text-sm mt-0.5">بيع أو التبرع بالورق المجمّع لجهات موثوقة بدل التخزين الدائم</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
          <p className="text-lg font-bold text-green-700">{totalActiveWeight.toFixed(1)} كجم</p>
          <p className="text-[11px] text-green-600">متاح حالياً بالمستودع</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('partners')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'partners' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}>
          الشركاء
        </button>
        <button onClick={() => setTab('requests')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${tab === 'requests' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}>
          <ClipboardList className="w-3.5 h-3.5" /> طلبات الاستلام
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {requests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-green-600 text-sm">جارٍ التحميل...</div>
      ) : tab === 'partners' ? (
        <>
          {/* Comparison table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs">
                  <th className="text-right px-4 py-3 font-medium">الشريك</th>
                  <th className="text-center px-3 py-3 font-medium">تشتري الورق</th>
                  <th className="text-center px-3 py-3 font-medium">استلام من الموقع</th>
                  <th className="text-center px-3 py-3 font-medium">أقل كمية</th>
                  <th className="text-center px-3 py-3 font-medium">إصدار شهادة</th>
                </tr>
              </thead>
              <tbody>
                {activePartners.map(p => (
                  <tr key={p.id} className="border-t border-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-3 py-3 text-center">{TRI_LABEL[p.buys_paper ?? 'no']}</td>
                    <td className="px-3 py-3 text-center">{p.pickup_from_site ? '✅' : '❌'}</td>
                    <td className="px-3 py-3 text-center text-gray-600 text-xs">{p.min_quantity ?? '—'}</td>
                    <td className="px-3 py-3 text-center">{TRI_LABEL[p.issues_certificate ?? 'no']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Partner cards */}
          <div className="grid gap-4 mb-8">
            {activePartners.map(p => (
              <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Recycle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">{p.name}</h3>
                      <span className="text-[11px] text-gray-400">{TYPE_LABEL[p.type]}</span>
                    </div>
                  </div>
                  <button onClick={() => setModalPartner(p)}
                    className="flex-shrink-0 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-all">
                    طلب استلام
                  </button>
                </div>

                {p.description && <p className="text-xs text-gray-500 mb-3 leading-relaxed">{p.description}</p>}

                {p.services?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.services.map(s => (
                      <span key={s} className="text-[11px] bg-gray-50 text-gray-600 px-2 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-500 pt-3 border-t border-gray-50">
                  {p.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{p.city}</span>}
                  {p.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{p.phone}</span>}
                  {p.mobile && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{p.mobile}</span>}
                  {p.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{p.email}</span>}
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-green-600 hover:underline">
                      <Globe className="w-3.5 h-3.5" />الموقع الإلكتروني
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Regulatory reference */}
          {regulatoryPartners.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> جهات تنظيمية (للمرجعية فقط)
              </h2>
              {regulatoryPartners.map(p => (
                <div key={p.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-700 text-sm">{p.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{p.description}</p>
                    <p className="text-[11px] text-gray-400 mt-2">
                      ليست جهة شراء — تُستخدم للتحقق من تراخيص شركات إعادة التدوير قبل التعامل معها.
                    </p>
                  </div>
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noreferrer"
                      className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-white transition-all">
                      <ExternalLink className="w-3.5 h-3.5" /> الموقع
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Requests queue */}
          <div className="flex justify-end mb-3">
            <button onClick={downloadReport} disabled={requests.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all">
              <Download className="w-3.5 h-3.5" /> تحميل تقرير CSV
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-20 text-gray-300">
              <ClipboardList className="w-14 h-14 mx-auto mb-3 opacity-40" />
              <p className="text-sm">لا توجد طلبات استلام بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(r => (
                <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${REQUEST_STATUS_COLOR[r.status]}`}>
                          {REQUEST_STATUS_LABEL[r.status]}
                        </span>
                        <span className="text-xs font-medium text-gray-700">{r.partners?.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        الوزن: <strong className="text-gray-800">{r.available_weight} كجم</strong>
                        {r.paper_types?.length > 0 && <> · {r.paper_types.join('، ')}</>}
                      </p>
                      {r.notes && <p className="text-xs text-gray-400 mt-1 bg-gray-50 px-2 py-1 rounded-lg inline-block">{r.notes}</p>}
                    </div>
                    {role === 'facility_manager' && r.status !== 'completed' && r.status !== 'cancelled' && (
                      <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 flex-shrink-0">
                        {Object.entries(REQUEST_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {modalPartner && (
        <RequestModal partner={modalPartner} maxWeight={totalActiveWeight}
          onClose={() => setModalPartner(null)} onDone={() => { setModalPartner(null); load() }} />
      )}
    </div>
  )

  async function updateStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('partner_pickup_requests').update({ status }).eq('id', id)
    load()
  }
}

function RequestModal({ partner, maxWeight, onClose, onDone }:
  { partner: Partner; maxWeight: number; onClose: () => void; onDone: () => void }) {
  const [weight, setWeight] = useState(maxWeight > 0 ? String(maxWeight) : '')
  const [types, setTypes] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const MATERIAL_OPTIONS = ['ورق أبيض', 'كرتون', 'جرائد', 'مجلات', 'كتب']

  function toggleType(t: string) {
    setTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])
  }

  async function submit() {
    if (!weight) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('partner_pickup_requests').insert({
      partner_id: partner.id,
      requested_by: user?.id,
      available_weight: parseFloat(weight),
      paper_types: types,
      notes: notes || null,
    })
    setSaving(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">طلب استلام</h2>
            <p className="text-xs text-gray-400">{partner.name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-[11px] text-blue-700">
            هذا الإجراء ينشئ مهمة داخلية لمدير المرافق للمتابعة — ولا يُرسل طلب فعلي للشريك تلقائياً.
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">الوزن المتاح (كجم) *</label>
            <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">أنواع الورق</label>
            <div className="flex flex-wrap gap-2">
              {MATERIAL_OPTIONS.map(t => (
                <button key={t} onClick={() => toggleType(t)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all
                    ${types.includes(t) ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">ملاحظات (اختياري)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none" />
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
          <button onClick={submit} disabled={!weight || saving}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-all disabled:opacity-40">
            {saving ? 'جارٍ الإرسال...' : 'إنشاء المهمة'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}
