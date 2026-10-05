import { NextResponse } from 'next/server'

import { testersSchema } from '@/lib/schemas/forms'
import { spamReason } from '@/lib/forms/antispam'
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

  /* Antispam — descarte SILENCIOSO: se responde 200 para que el bot crea que
     ha colado y no reintente por otra vía. El motivo solo va al log del
     servidor; devolverlo en la respuesta le enseñaría qué trampa ha pisado. */
  const spam = spamReason(data)
  if (spam) {
    // eslint-disable-next-line no-console
    console.warn('[testers] descartado por antispam:', spam)
    return NextResponse.json({ ok: true }, { status: 200 })
  }
  /* Los envíos que SÍ pasan también se registran. Sin esta línea el filtro
     sería invisible: como el descarte responde 200 igual que un envío bueno,
     desde fuera no hay forma de distinguirlos, y un falso positivo —gente real
     a la que la trampa descartara— se perdería en silencio. Con las dos líneas,
     el log de Netlify dice cuánto spam se corta y confirma que lo legítimo
     entra. Sin datos personales: solo el hecho y el tiempo que tardó. */
  // eslint-disable-next-line no-console
  console.info('[testers] antispam ok —', data.elapsedMs, 'ms')
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
