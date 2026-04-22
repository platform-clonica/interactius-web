import { NextResponse } from 'next/server'

import { newsletterSchema } from '@/lib/schemas/forms'
import { submitToHubspot } from '@/lib/hubspot/submit'

/* ==========================================================================
   POST /api/newsletter — suscripción a la newsletter
   --------------------------------------------------------------------------
   Variables de entorno requeridas en producción:
     HUBSPOT_PORTAL_ID
     HUBSPOT_ACCESS_TOKEN
     HUBSPOT_FORM_ID_NEWSLETTER

   En desarrollo sin credenciales: loga el envío y devuelve ok:true (stub).
   ========================================================================== */

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
  const formId = process.env.HUBSPOT_FORM_ID_NEWSLETTER

  if (!formId) {
    // Modo stub — sin credenciales configuradas.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[newsletter] stub — subscribed', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        company: data.company,
      })
    }
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const result = await submitToHubspot({
    formId,
    fields: [
      { name: 'firstname', value: data.firstName },
      { name: 'lastname', value: data.lastName },
      { name: 'email', value: data.email },
      { name: 'company', value: data.company ?? '' },
    ],
    pageUri: request.headers.get('referer') ?? undefined,
  })

  if (!result.ok) {
    if (result.status === 0 && result.message === 'HUBSPOT_NOT_CONFIGURED') {
      // eslint-disable-next-line no-console
      console.warn('[newsletter] Hubspot not fully configured')
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // eslint-disable-next-line no-console
    console.error('[newsletter] Hubspot error', result.status, result.message)
    return NextResponse.json({ error: 'upstream_error' }, { status: 502 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
