import { type LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  unit?: string
  Icon: LucideIcon
  iconBg: string
  sub?: string
}

export default function StatCard({ label, value, unit, Icon, iconBg, sub }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-800">
          {value}
          {unit && <span className="text-sm font-normal text-gray-400 mr-1">{unit}</span>}
        </p>
        {sub && <p className="text-xs text-green-600 mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  )
}
