// src/app/api/classify-paper/route.ts
// تصنيف نوع الورق من صورة الإثبات باستخدام Claude Vision.
// تحتاج متغير بيئة ANTHROPIC_API_KEY في Vercel. بدونه، تعيد { error: 'no_api_key' } بدون كسر الصفحة.

import { NextResponse } from 'next/server'

const VALID_TYPES = ['mixed', 'shredded', 'cardboard', 'confidential'] as const

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'no_api_key' })
  }

  const { imageBase64, mediaType } = await req.json()
  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ error: 'missing_image' })
  }

  const prompt = `أنت مساعد تصنيف في منصة EcoPaper لإدارة نفايات الورق الجامعي.
انظر للصورة المرفقة وصنّف نوع الورق الظاهر فيها إلى واحدة فقط من هذه الفئات:
- mixed: ورق مختلط (أوراق مكتبية، مجلات، أوراق عامة غير متجانسة)
- shredded: ورق مقطوع (خضع لآلة تقطيع)
- cardboard: كرتون (صناديق، تغليف مقوى)
- confidential: وثائق سرية (مغلفة أو عليها ختم سرية واضح)

أجب بصيغة JSON فقط بدون أي نص إضافي، بالشكل التالي:
{"type": "<one of the four keys above>", "confidence": <0 to 1>, "reason": "<جملة عربية قصيرة توضح سبب التصنيف>"}

إذا لم تستطع تمييز محتوى واضح للورق في الصورة، أعد {"type": "unknown", "confidence": 0, "reason": "..."}.`

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
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    })

    if (!res.ok) return NextResponse.json({ error: 'request_failed' })

    const data = await res.json()
    const text = data?.content?.find((c: any) => c.type === 'text')?.text ?? ''

    let parsed: { type: string; confidence: number; reason: string } | null = null
    try {
      const cleaned = text.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'parse_failed' })
    }

    if (!parsed || !VALID_TYPES.includes(parsed.type as any)) {
      return NextResponse.json({
        type: 'unknown',
        confidence: 0,
        reason: parsed?.reason ?? 'تعذّر تمييز نوع الورق بثقة كافية',
      })
    }

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'request_failed' })
  }
}