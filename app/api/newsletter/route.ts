import { NextResponse } from 'next/server'

import { newsletterSchema } from '@/lib/schemas/forms'

/**
 * POST /api/newsletter — suscripción a la newsletter (stub funcional).
 *
 * TODO: decidir provider (Mailchimp / Brevo / Hubspot newsletter) y
 * sustituir el stub por la llamada real. El contrato del cliente ya está
 * congelado — cambiar provider NO requiere tocar el ContactForm.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_json' },
      { status: 400 },
    )
  }

  const parsed = newsletterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  const data = parsed.data

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[newsletter] subscribed', {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      company: data.company,
    })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
