'use client'

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const MONTHLY = [
  { month: 'أكتوبر',  weight: 280 },
  { month: 'نوفمبر',  weight: 320 },
  { month: 'ديسمبر',  weight: 290 },
  { month: 'يناير',   weight: 215 },
]

const BUILDINGS = [
  { building: 'مبنى A', weight: 145 },
  { building: 'مبنى B', weight: 89  },
  { building: 'مبنى C', weight: 120 },
  { building: 'مبنى D', weight: 78  },
  { building: 'مبنى E', weight: 56  },
]

export default function AnalyticsCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p className="text-sm font-semibold text-gray-700 mb-4">الاتجاه الشهري (كجم)</p>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY} margin={{ top:5, right:5, left:-10, bottom:0 }}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="month" tick={{ fontSize:11 }} />
              <YAxis               tick={{ fontSize:11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="weight" stroke="#16A34A" strokeWidth={2} fill="url(#ag)" name="كجم" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p className="text-sm font-semibold text-gray-700 mb-4">أعلى المباني إنتاجاً</p>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={BUILDINGS} layout="vertical" margin={{ top:0, right:10, left:10, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis type="number" tick={{ fontSize:10 }} />
              <YAxis dataKey="building" type="category" tick={{ fontSize:10 }} width={55} />
              <Tooltip />
              <Bar dataKey="weight" fill="#16A34A" radius={[0,4,4,0]} name="كجم" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
