import { NextResponse } from 'next/server'

import { bdwSchema } from '@/lib/schemas/forms'
import { submitToHubspot } from '@/lib/hubspot/submit'

/* ==========================================================================
   POST /api/bdw — inscripción al taller OFF BDW (Barcelona Design Week 2026)
   --------------------------------------------------------------------------
   Variables de entorno requeridas en producción:
     HUBSPOT_PORTAL_ID        (= 4602147, compartido con el resto de forms)
     HUBSPOT_FORM_ID_BDW      (= 146db717-f771-4312-8fa5-d86c74ff0e0d)

   En desarrollo sin credenciales: loga el envío y devuelve ok:true (stub).

   Nota: los nombres internos de campo (job_function, fecha_de_nacimiento___,
   situacion_del_hogar…) se reutilizan del form de testers contra el mismo
   portal. Verificar en HubSpot (Marketing → Forms) que el form BDW define
   estos campos: HubSpot descarta campos desconocidos en silencio (200).
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

  const parsed = bdwSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  const data = parsed.data
  const formId = process.env.HUBSPOT_FORM_ID_BDW

  if (!formId) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[bdw] stub — registered', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        company: data.company,
        sector: data.sector,
        role: data.role,
        subscribe: data.subscribe === true,
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
      // Sector es propiedad del objeto empresa (objectTypeId 0-2).
      { objectTypeId: '0-2', name: 'sector_empresa', value: data.sector ?? '' },
      { name: 'jobtitle', value: data.role ?? '' },
      { name: 'que_te_motiva_a_participar_', value: data.motivation },
    ],
    // Opt-in de marketing (Design Tapas, subscription 9792607). El procesamiento
    // de datos se consiente implícitamente al enviar (interés legítimo del form).
    legalConsentOptions: {
      consent: {
        consentToProcess: true,
        text: 'Acepto que Interactius almacene y procese mis datos personales para gestionar mi inscripción.',
        communications: [
          {
            value: data.subscribe === true,
            subscriptionTypeId: 9792607,
            text: 'Quiero recibir cada mes las Design Tapas de Interactius.',
          },
        ],
      },
    },
    pageUri: request.headers.get('referer') ?? undefined,
  })

  if (!result.ok) {
    if (result.status === 0 && result.message === 'HUBSPOT_NOT_CONFIGURED') {
      // eslint-disable-next-line no-console
      console.warn('[bdw] Hubspot not fully configured')
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // eslint-disable-next-line no-console
    console.error('[bdw] Hubspot error', result.status, result.message)
    return NextResponse.json({ error: 'upstream_error' }, { status: 502 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
