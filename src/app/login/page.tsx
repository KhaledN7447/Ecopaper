'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Leaf, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.user) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const role = profile?.role
    const dest =
      role === 'facility_manager' ? '/dashboard' :
      role === 'facility_staff'   ? '/queue'     : '/requests'

    window.location.href = dest
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #14532D 0%, #166534 60%, #15803D 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
               style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">EcoPaper</h1>
          <p className="text-green-300 text-sm mt-1">منصة إدارة النفايات الورقية الجامعية</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="text-base font-bold text-gray-800 mb-5">تسجيل الدخول</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">البريد الإلكتروني</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@university.edu"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 text-left"
                dir="ltr"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-sm
                         hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? 'جارٍ الدخول...' : 'دخول النظام'}
            </button>
          </form>
        </div>
        <p className="text-center text-green-400 text-xs mt-4">تواصل مع مسؤول النظام للحصول على حساب</p>
      </div>
    </div>
  )
}
