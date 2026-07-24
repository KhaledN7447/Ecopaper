import { Shield } from 'lucide-react'
import StatusBadge from '@/components/status-badge'
import { PAPER_TYPES, toTrees, toCO2kg } from '@/lib/utils'
import type { PickupRequest } from '@/types'

export default function RequestCard({ r }: { r: PickupRequest }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-all
      ${r.priority === 'urgent' ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="text-xs font-mono text-gray-300">{r.id.slice(0,8).toUpperCase()}</span>
            {r.priority === 'urgent' &&
              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">⚡ عاجل</span>}
            {r.secure_disposal &&
              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Shield className="w-3 h-3" />سري
              </span>}
          </div>
          <p className="font-semibold text-gray-800 text-sm">{r.building}{r.floor ? ` — ${r.floor}` : ''}</p>
          <p className="text-xs text-gray-500 mt-0.5">{PAPER_TYPES[r.paper_type]} · ~{r.estimated_weight} كجم</p>
          {r.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{r.notes}</p>}
        </div>
        <StatusBadge status={r.status} />
      </div>

      {r.status === 'completed' && r.actual_weight && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
          <span>وزن فعلي: <strong className="text-green-700">{r.actual_weight} كجم</strong></span>
          <span>🌳 {toTrees(r.actual_weight)} شجرة</span>
          <span>💨 {toCO2kg(r.actual_weight)} كجم CO₂</span>
        </div>
      )}
    </div>
  )
}
