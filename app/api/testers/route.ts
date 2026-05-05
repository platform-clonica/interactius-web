import { NextResponse } from 'next/server'

import { testersSchema } from '@/lib/schemas/forms'
import { submitToHubspot } from '@/lib/hubspot/submit'

/* ==========================================================================
   POST /api/testers — alta en el panel de testers (vía Hubspot Forms API)
   --------------------------------------------------------------------------
   Variables de entorno requeridas en producción:
     HUBSPOT_PORTAL_ID
     HUBSPOT_FORM_ID_TESTERS

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

  const parsed = testersSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  const data = parsed.data
  const formId = process.env.HUBSPOT_FORM_ID_TESTERS

  if (!formId) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[testers] stub — registered', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        profession: data.profession,
        city: data.city,
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
      { name: 'job_function', value: data.profession },
      { name: 'gender', value: data.gender ?? '' },
      { name: 'fecha_de_nacimiento___', value: data.birthdate },
      { name: 'situacion_del_hogar', value: data.householdSituation },
      { name: 'city', value: data.city },
      { name: 'state', value: data.state },
      { name: 'country', value: data.country },
    ],
    pageUri: request.headers.get('referer') ?? undefined,
  })

  if (!result.ok) {
    if (result.status === 0 && result.message === 'HUBSPOT_NOT_CONFIGURED') {
      // eslint-disable-next-line no-console
      console.warn('[testers] Hubspot not fully configured')
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // eslint-disable-next-line no-console
    console.error('[testers] Hubspot error', result.status, result.message)
    return NextResponse.json({ error: 'upstream_error' }, { status: 502 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
