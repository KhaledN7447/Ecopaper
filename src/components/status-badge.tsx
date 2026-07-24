import { CheckCircle, Clock, Truck, Package } from 'lucide-react'
import type { Status } from '@/types'

const CFG = {
  pending:     { label: 'قيد الانتظار', cls: 'bg-amber-100 text-amber-800',   Icon: Clock        },
  assigned:    { label: 'تم التعيين',   cls: 'bg-blue-100 text-blue-700',     Icon: Truck        },
  in_progress: { label: 'جارٍ التنفيذ', cls: 'bg-purple-100 text-purple-700', Icon: Package      },
  completed:   { label: 'مكتمل',        cls: 'bg-green-100 text-green-700',   Icon: CheckCircle  },
}

export default function StatusBadge({ status }: { status: Status }) {
  const { label, cls, Icon } = CFG[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <Icon className="w-3 h-3" />{label}
    </span>
  )
}
