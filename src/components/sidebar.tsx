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

  const nav = NAV.filter(n => n.roles.includes(profile.role))

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-52 flex flex-col flex-shrink-0 h-full" style={{ background: '#14532D' }}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-green-800">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-base">EcoPaper</span>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-b border-green-800">
        <p className="text-white text-sm font-medium truncate">{profile.name}</p>
        <p className="text-green-400 text-xs truncate">
          {(profile as any).departments?.name ?? '—'}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {nav.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all
                ${active ? 'bg-green-500 text-white' : 'text-green-200 hover:bg-green-800'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-green-800">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-green-300 hover:bg-green-800 transition-all">
          <LogOut className="w-4 h-4" />
          <span className="text-sm">خروج</span>
        </button>
      </div>
    </aside>
  )
}
