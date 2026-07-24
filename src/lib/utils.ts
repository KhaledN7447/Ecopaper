import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PAPER_TYPES = {
  mixed:       'ورق مختلط',
  shredded:    'ورق مقطوع',
  cardboard:   'كرتون',
  confidential:'وثائق سرية',
} as const

export const STATUS_CONFIG = {
  pending:     { label: 'قيد الانتظار', bg: 'bg-amber-100',  text: 'text-amber-800'  },
  assigned:    { label: 'تم التعيين',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
  in_progress: { label: 'جارٍ التنفيذ', bg: 'bg-purple-100', text: 'text-purple-700' },
  completed:   { label: 'مكتمل',        bg: 'bg-green-100',  text: 'text-green-700'  },
} as const

export const ROLE_LABELS = {
  department_user:  'موظف قسم',
  facility_staff:   'طاقم المرافق',
  facility_manager: 'مدير المرافق',
} as const

export const BUILDINGS = ['مبنى A','مبنى B','مبنى C','مبنى D','مبنى E']
export const FLOORS    = ['الطابق 1','الطابق 2','الطابق 3','الطابق 4','الطابق 5']

export function toTrees(kg: number)   { return (kg / 40).toFixed(1) }
export function toCO2kg(kg: number)   { return (kg * 3.3).toFixed(1) }
export function toCO2tons(kg: number) { return (kg * 3.3 / 1000).toFixed(2) }
export function sumActualWeight(requests: { actual_weight: number | null; status: string }[]) {
  return requests
    .filter(r => r.status === 'completed' && r.actual_weight)
    .reduce((sum, r) => sum + (r.actual_weight ?? 0), 0)
}
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', { year:'numeric', month:'short', day:'numeric' })
}
