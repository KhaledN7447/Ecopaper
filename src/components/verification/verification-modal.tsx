'use client'

import { useState, useTransition } from 'react'
import { X, Upload, CheckCircle, Sparkles, AlertTriangle } from 'lucide-react'
import { PAPER_TYPES, toTrees, toCO2kg } from '@/lib/utils'
import type { PickupRequest } from '@/types'

interface Props {
  request: PickupRequest
  onComplete: (id: string, weight: number, notes: string, imageFile: File | null) => Promise<void>
  onClose: () => void
}

type Classification = { type: string; confidence: number; reason: string } | null

function fileToBase64(file: File): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve({ data: result.split(',')[1], mediaType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function VerificationModal({ request: r, onComplete, onClose }: Props) {
  const [weight,      setWeight]      = useState('')
  const [notes,       setNotes]       = useState('')
  const [file,        setFile]        = useState<File | null>(null)
  const [preview,     setPreview]     = useState(false)
  const [pending,     startTrans]     = useTransition()
  const [classifying, setClassifying] = useState(false)
  const [classification, setClassification] = useState<Classification>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setPreview(!!f)
    setClassification(null)
    if (!f) return

    setClassifying(true)
    try {
      const { data, mediaType } = await fileToBase64(f)
      const res = await fetch('/api/classify-paper', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageBase64: data, mediaType }),
      })
      const result = await res.json()
      if (!result.error) setClassification(result)
    } catch {
      // فشل صامت — التصنيف اختياري ولا يمنع إتمام الطلب
    } finally {
      setClassifying(false)
    }
  }

  async function handle() {
    if (!weight) return
    startTrans(async () => {
      await onComplete(r.id, parseFloat(weight), notes, file)
    })
  }

  const kg = parseFloat(weight) || 0

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">إتمام التحقق</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-0.5">
            <p className="font-semibold text-gray-700">{r.department_name}</p>
            <p className="text-gray-500 text-xs">
              {r.building} · {PAPER_TYPES[r.paper_type]} · مقدر: {r.estimated_weight} كجم
            </p>
          </div>

          {/* Actual weight */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">الوزن الفعلي (كجم) *</label>
            <input
              type="number" step="0.1" min="0"
              value={weight} onChange={e => setWeight(e.target.value)}
              placeholder="أدخل الوزن الفعلي"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">صورة الإثبات</label>
            <label className={`flex flex-col items-center justify-center w-full py-5 border-2 border-dashed rounded-xl cursor-pointer transition-all
              ${preview ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300 bg-gray-50'}`}>
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              {preview
                ? <><CheckCircle className="w-6 h-6 text-green-500 mb-1" /><span className="text-sm text-green-700">{file?.name}</span></>
                : <><Upload className="w-6 h-6 text-gray-400 mb-1" /><span className="text-sm text-gray-400">انقر لرفع صورة</span></>
              }
            </label>

            {classifying && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                جارٍ تحليل نوع الورق بالذكاء الاصطناعي...
              </div>
            )}

            {!classifying && classification && classification.type !== 'unknown' && (
              <div className={`mt-2 rounded-lg px-3 py-2 text-xs flex items-start gap-1.5
                ${classification.type === r.paper_type ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>
                {classification.type === r.paper_type
                  ? <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  : <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
                <div>
                  <p className="font-medium">
                    الذكاء الاصطناعي يرى: {PAPER_TYPES[classification.type as keyof typeof PAPER_TYPES]}
                    {' '}({Math.round(classification.confidence * 100)}٪ ثقة)
                  </p>
                  {classification.type !== r.paper_type && (
                    <p className="mt-0.5">يختلف عن النوع المسجل بالطلب ({PAPER_TYPES[r.paper_type]}) — تحقق قبل الإغلاق.</p>
                  )}
                </div>
              </div>
            )}

            {!classifying && classification?.type === 'unknown' && (
              <p className="text-xs text-gray-400 mt-2">تعذّر على الذكاء الاصطناعي تمييز نوع الورق من الصورة.</p>
            )}
          </div>

          {/* Environmental impact */}
          {kg > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-green-800 mb-1.5">الأثر البيئي المتوقع</p>
              <div className="flex gap-5 text-xs text-green-700">
                <span>🌳 {toTrees(kg)} شجرة محفوظة</span>
                <span>💨 {toCO2kg(kg)} كجم CO₂ مقلص</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">ملاحظات (اختياري)</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={handle} disabled={!weight || pending}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm
                       hover:bg-green-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {pending ? 'جارٍ الحفظ...' : 'إغلاق الطلب'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}