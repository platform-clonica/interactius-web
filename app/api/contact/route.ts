import { NextResponse } from 'next/server'

import { contactSchema as contactoSchema } from '@/lib/schemas/forms'
import { submitToHubspot } from '@/lib/hubspot/submit'

/* ==========================================================================
   POST /api/contact — envío a Hubspot
   --------------------------------------------------------------------------
   Variables de entorno requeridas en producción:
     HUBSPOT_PORTAL_ID
     HUBSPOT_ACCESS_TOKEN
     HUBSPOT_FORM_ID_CONTACT

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

  const parsed = contactoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  const data = parsed.data
  const formId = process.env.HUBSPOT_FORM_ID_CONTACT

  if (!formId) {
    // Modo stub — sin credenciales configuradas.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[contact] stub — received', {
        name: data.name,
        company: data.company,
        email: data.email,
        messagePreview: data.message.slice(0, 80),
      })
    }
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const result = await submitToHubspot({
    formId,
    fields: [
      { name: 'firstname', value: data.name },
      { name: 'email', value: data.email },
      { name: 'company', value: data.company ?? '' },
      { name: 'message', value: data.message },
    ],
    pageUri: request.headers.get('referer') ?? undefined,
  })

  if (!result.ok) {
    if (result.status === 0 && result.message === 'HUBSPOT_NOT_CONFIGURED') {
      // Credenciales parciales (formId presente pero portal/token ausentes).
      // eslint-disable-next-line no-console
      console.warn('[contact] Hubspot not fully configured')
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // eslint-disable-next-line no-console
    console.error('[contact] Hubspot error', result.status, result.message)
    return NextResponse.json({ error: 'upstream_error' }, { status: 502 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
