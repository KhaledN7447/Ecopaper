'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Leaf, Eye, EyeOff, Recycle, Package, TrendingUp } from 'lucide-react'

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

  const features = [
    { Icon: Recycle,    label: 'تدوير ذكي',     desc: 'تتبع كل عملية جمع من الطلب حتى إعادة التدوير' },
    { Icon: Package,     label: 'إدارة المستودع', desc: 'رصد كميات الورق المجمّع بدقة وسهولة' },
    { Icon: TrendingUp, label: 'تقارير وتحليلات', desc: 'قياس الأثر البيئي لكل قسم بالجامعة' },
  ]

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #14532D 0%, #166534 60%, #15803D 100%)' }}
    >
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-10 items-center">

        {/* القسم الداعم / الترويجي */}
        <div className="hidden lg:flex flex-col text-white px-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
               style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Leaf className="w-7 h-7 text-white" />
          </div>

          <h1 className="text-4xl font-bold mb-3">EcoPaper</h1>
          <p className="text-green-200 text-base mb-8 leading-relaxed">
            منصة رقمية متكاملة تربط أقسام الجامعة بفريق الاستدامة، لتحويل نفايات الورق
            إلى أثر بيئي إيجابي قابل للقياس، بخطوات بسيطة وشفافة للجميع.
          </p>

          {/* رسم توضيحي بسيط SVG بدون رفع صور */}
          <svg viewBox="0 0 300 140" className="w-full max-w-xs mb-8 opacity-90">
            <circle cx="60" cy="70" r="45" fill="rgba(255,255,255,0.08)" />
            <circle cx="150" cy="40" r="28" fill="rgba(255,255,255,0.12)" />
            <circle cx="230" cy="90" r="35" fill="rgba(255,255,255,0.10)" />
            <path d="M40 75 Q60 40 90 60 Q100 70 85 85 Q65 100 40 75 Z" fill="#4ADE80" opacity="0.85" />
            <path d="M140 45 Q160 20 185 35 Q195 45 180 55 Q160 68 140 45 Z" fill="#86EFAC" opacity="0.8" />
            <path d="M210 95 Q235 65 260 82 Q270 92 255 105 Q230 120 210 95 Z" fill="#4ADE80" opacity="0.75" />
          </svg>

          <div className="space-y-4">
            {features.map(({ Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                     style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <Icon className="w-4 h-4 text-green-200" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-green-300">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* فورم تسجيل الدخول */}
        <div className="w-full max-w-sm mx-auto">
          <div className="text-center mb-8 lg:hidden">
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
    </div>
  )
}