'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Leaf, BarChart2, ClipboardList, Truck, TrendingUp, LogOut, Package, Recycle, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
const NAV = [
  { href: '/dashboard', label: 'لوحة التحكم',  Icon: BarChart2,    roles: ['facility_manager'] },
  { href: '/requests',  label: 'طلباتي',        Icon: ClipboardList, roles: ['department_user']  },
  { href: '/queue',     label: 'قائمة المهام',  Icon: Truck,         roles: ['facility_staff']   },
{ href: '/warehouse', label: 'المستودع',       Icon: Package,       roles: ['facility_staff', 'facility_manager'] },
  { href: '/partners',  label: 'الشركاء',        Icon: Recycle,       roles: ['facility_staff', 'facility_manager'] },
  { href: '/analytics', label: 'التحليلات',     Icon: TrendingUp,    roles: ['facility_manager','facility_staff','department_user'] },
  { href: '/ai-insights', label: 'التوقعات الذكية', Icon: Sparkles, roles: ['facility_staff', 'facility_manager'] },
]
export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router   = useRouter()
  const nav =