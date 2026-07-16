// src/app/api/ai-summary/route.ts
// طبقة اختيارية: تستخدم Claude API لتحويل الإحصائيات المحسوبة إلى ملخص عربي.
// تحتاج متغير بيئة ANTHROPIC_API_KEY في Vercel. بدونه، تعيد { error: 'no_api_key' } بدون كسر الصفحة.

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'no_api_key' })
  }

  const stats = await req.json()

  const prompt = `أنت محلل بيانات في منصة EcoPaper لإدارة نفايات الورق الجامعي.
بناءً على البيانات التالية (JSON)، اكتب فقرة عربية واحدة (3-4 جمل فقط) تلخص أهم اتجاه، وتذكر توصية عملية واحدة.
لا تخترع أي أرقام غير موجودة في البيانات أدناه.

البيانات:
${JSON.stringify(stats).slice(0, 4000)}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) return NextResponse.json({ error: 'request_failed' })

    const data = await res.json()
    const text = data?.content?.find((c: any) => c.type === 'text')?.text ?? null
    return NextResponse.json({ summary: text })
  } catch {
    return NextResponse.json({ error: 'request_failed' })
  }
}
