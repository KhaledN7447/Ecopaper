'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/sidebar'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('profiles')
        .select('*, departments(name, building)')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setProfile(data)
          setLoading(false)
        })
    })
  }, [])

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F0FDF4]">
      <div className="text-green-600 text-sm">جارٍ التحميل...</div>
    </div>
  )

  if (!profile) return (
    <div className="flex h-screen items-center justify-center bg-[#F0FDF4]">
      <div className="text-red-500 text-sm">خطأ في تحميل البيانات</div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0FDF4]">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
