'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package, Plus, AlertTriangle, CheckCircle, Trash2, X } from 'lucide-react'

const PAPER_TYPES: Record<string, string> = {
  mixed: 'ورق مختلط',
  shredded: 'ورق مقطوع',
  cardboard: 'كرتون',
  confidential: 'وثائق سرية',
}

interface WarehouseItem {
  id: string
  paper_type: string
  weight: number
  deposit_date: string
  retention_years: number
  status: string
  notes: string | null
  created_at: string
}

function getDaysUntilDestruction(depositDate: string, retentionYears: number) {
  const deposit = new Date(depositDate)
  const destroyDate = new Date(deposit)
  destroyDate.setFullYear(destroyDate.getFullYear() + retentionYears)
  const today = new Date()
  const diffTime = destroyDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return { diffDays, destroyDate }
}

function StatusTag({ depositDate, retentionYears }: { depositDate: string; retentionYears: number }) {
  const { diffDays } = getDaysUntilDestruction(depositDate, retentionYears)
  if (diffDays <= 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <AlertTriangle className="w-3 h-3" /> جاهز للإتلاف
    </span>
  )
  if (diffDays <= 90) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      <AlertTriangle className="w-3 h-3" /> قريب ({diffDays} يوم)
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle className="w-3 h-3" /> نشط ({diffDays} يوم)
    </span>
  )
}

export default function WarehousePage() {
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    paper_type: 'mixed',
    weight: '',
    deposit_date: new Date().toISOString().split('T')[0],
    retention_years: '3',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    const supabase = createClient()
    const { data } = await supabase
      .from('warehouse_items')
      .select('*')
      .eq('status', 'active')
      .order('deposit_date', { ascending: true })
    setItems(data ?? [])
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.weight) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('warehouse_items').insert({
      paper_type: form.paper_type,
      weight: parseFloat(form.weight),
      deposit_date: form.deposit_date,
      retention_years: parseInt(form.retention_years),
      notes: form.notes || null,
      created_by: user?.id,
    })
    setShowForm(false)
    setForm({ paper_type: 'mixed', weight: '', deposit_date: new Date().toISOString().split('T')[0], retention_years: '3', notes: '' })
    setSaving(false)
    loadItems()
  }

  async function handleDestroy(id: string) {
    const supabase = createClient()
    await supabase.from('warehouse_items').update({ status: 'destroyed' }).eq('id', id)
    loadItems()
  }

  const readyCount = items.filter(i => getDaysUntilDestruction(i.deposit_date, i.retention_years).diffDays <= 0).length
  const soonCount  = items.filter(i => { const { diffDays } = getDaysUntilDestruction(i.deposit_date, i.retention_years); return diffDays > 0 && diffDays <= 90 }).length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Alert banner */}
      {readyCount > 0 && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">⚠️ تنبيه: {readyCount} دفعة جاهزة للإتلاف</p>
            <p className="text-xs text-red-600 mt-0.5">انتهت مدة الاحتفاظ — يرجى اتخاذ الإجراء اللازم</p>
          </div>
        </div>
      )}

      {soonCount > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-800">تنبيه: {soonCount} دفعة ستنتهي مدتها خلال 90 يوم</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">المستودع</h1>
          <p className="text-gray-400 text-sm mt-0.5">تتبع الأوراق المخزنة ومواعيد إتلافها</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> إضافة دفعة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-gray-800">{items.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">إجمالي الدفعات</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center shadow-sm border border-red-100">
          <p className="text-2xl font-bold text-red-700">{readyCount}</p>
          <p className="text-xs text-red-500 mt-0.5">جاهزة للإتلاف</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-gray-800">
            {items.reduce((sum, i) => sum + i.weight, 0).toFixed(1)} كجم
          </p>
          <p className="text-xs text-gray-400 mt-0.5">إجمالي الوزن</p>
        </div>
      </div>

      {/* Items list */}
      {loading ? (
        <div className="text-center py-10 text-green-600 text-sm">جارٍ التحميل...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-300">
          <Package className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">لا توجد دفعات في المستودع</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const { diffDays, destroyDate } = getDaysUntilDestruction(item.deposit_date, item.retention_years)
            const isReady = diffDays <= 0
            return (
              <div key={item.id} className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${isReady ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusTag depositDate={item.deposit_date} retentionYears={item.retention_years} />
                      <span className="text-xs text-gray-400">{PAPER_TYPES[item.paper_type]}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                      <span className="text-gray-500">الوزن: <strong className="text-gray-800">{item.weight} كجم</strong></span>
                      <span className="text-gray-500">تاريخ الإيداع: <strong className="text-gray-800">{item.deposit_date}</strong></span>
                      <span className="text-gray-500">مدة الاحتفاظ: <strong className="text-gray-800">{item.retention_years} سنوات</strong></span>
                      <span className="text-gray-500">موعد الإتلاف: <strong className={isReady ? 'text-red-700' : 'text-gray-800'}>{destroyDate.toLocaleDateString('ar-SA')}</strong></span>
                    </div>
                    {item.notes && <p className="text-xs text-gray-400 mt-2 bg-gray-50 px-2 py-1 rounded-lg">{item.notes}</p>}
                  </div>
                  {isReady && (
                    <button onClick={() => handleDestroy(item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-xs font-medium flex-shrink-0">
                      <Trash2 className="w-3 h-3" /> تأكيد الإتلاف
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">إضافة دفعة جديدة</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">نوع الورق</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PAPER_TYPES).map(([k, v]) => (
                    <button key={k} onClick={() => setForm(p => ({ ...p, paper_type: k }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all
                        ${form.paper_type === k ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">الوزن (كجم) *</label>
                <input type="number" step="0.1" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))}
                  placeholder="مثال: 50"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">تاريخ الإيداع</label>
                <input type="date" value={form.deposit_date} onChange={e => setForm(p => ({ ...p, deposit_date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">مدة الاحتفاظ</label>
                <div className="flex gap-2">
                  {['1','2','3','4','5'].map(y => (
                    <button key={y} onClick={() => setForm(p => ({ ...p, retention_years: y }))}
                      className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all
                        ${form.retention_years === y ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                      {y} سنة
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">ملاحظات (اختياري)</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
              <button onClick={handleSubmit} disabled={!form.weight || saving}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-all disabled:opacity-40">
                {saving ? 'جارٍ الحفظ...' : 'حفظ الدفعة'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}