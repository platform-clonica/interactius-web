import { NextResponse } from 'next/server'
import { z } from 'zod'

const testersSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  profession: z.string().min(2),
  gender: z.string().optional(),
  city: z.string().min(2),
  birthdate: z.string().min(1),
  privacy: z.literal(true),
})

/**
 * POST /api/testers — alta en el panel de testers (stub funcional).
 *
 * TODO: el panel de testers es Insight Panel® propio. Decidir endpoint
 * interno o proveedor externo y sustituir el stub.
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

  const parsed = testersSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  const data = parsed.data

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[testers] registered', {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      profession: data.profession,
      city: data.city,
    })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
