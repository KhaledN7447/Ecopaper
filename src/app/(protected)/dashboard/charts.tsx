'use client'

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const WEEKLY = [
  { day: 'السبت',    weight: 45 },
  { day: 'الأحد',    weight: 78 },
  { day: 'الاثنين',  weight: 32 },
  { day: 'الثلاثاء', weight: 91 },
  { day: 'الأربعاء', weight: 56 },
  { day: 'الخميس',   weight: 67 },
  { day: 'الجمعة',   weight: 23 },
]

const BUILDINGS = [
  { building: 'مبنى A', weight: 145 },
  { building: 'مبنى B', weight: 89  },
  { building: 'مبنى C', weight: 120 },
  { building: 'مبنى D', weight: 78  },
  { building: 'مبنى E', weight: 56  },
]

export default function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p className="text-sm font-semibold text-gray-700 mb-4">الجمع اليومي هذا الأسبوع (كجم)</p>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={WEEKLY} margin={{ top:5, right:5, left:-20, bottom:0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="day"    tick={{ fontSize:10 }} />
              <YAxis                  tick={{ fontSize:10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="weight" stroke="#16A34A" strokeWidth={2} fill="url(#g1)" name="كجم" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p className="text-sm font-semibold text-gray-700 mb-4">النفايات بحسب المبنى (كجم)</p>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={BUILDINGS} margin={{ top:5, right:5, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="building" tick={{ fontSize:10 }} />
              <YAxis                    tick={{ fontSize:10 }} />
              <Tooltip />
              <Bar dataKey="weight" fill="#16A34A" radius={[4,4,0,0]} name="كجم" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
