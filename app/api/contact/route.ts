import { NextResponse } from 'next/server'
import { z } from 'zod'

/* ==========================================================================
   Schema — debe coincidir con el del ContactForm.
   Duplicación intencional: server-side no puede confiar en el cliente.
   ========================================================================== */

const contactoSchema = z.object({
  name: z.string().min(2),
  company: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(10),
  privacy: z.literal(true),
})

/* ==========================================================================
   POST /api/contact — envío a Hubspot (stub funcional)
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

  // ------------------------------------------------------------------------
  // TODO Sprint 3 final — cuando estén las credenciales reales:
  // 1. Leer HUBSPOT_PORTAL_ID, HUBSPOT_FORM_ID, HUBSPOT_API_KEY de process.env.
  // 2. POST a https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formId}
  //    con body { fields: [{name, value}, ...], context: {...} }.
  // 3. Si el fetch falla, devolver 502 (upstream error) y logear en Sentry.
  // ------------------------------------------------------------------------

  // Stub: log + success.
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[contact] received', {
      name: data.name,
      company: data.company,
      email: data.email,
      messagePreview: data.message.slice(0, 80),
    })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
