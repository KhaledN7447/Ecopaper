export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EcoPaper — إدارة النفايات الورقية',
  description: 'منصة إدارة النفايات الورقية الجامعية',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  )
}
