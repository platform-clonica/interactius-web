import { NextResponse, type NextRequest } from 'next/server'

import { autenticar } from '@/lib/clientes/auth'
import { almacenes, secretoSesion } from '@/lib/clientes/config'
import { destinoSeguro, noDisponible, origenValido } from '@/lib/clientes/http'
import { redirigir } from '@/lib/clientes/redirect'
import { COOKIE_SESION, DURACION_SESION_MS, crearTokenSesion } from '@/lib/clientes/session'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!origenValido(req)) return new NextResponse('Forbidden', { status: 403 })

  const form = await req.formData()
  const next = destinoSeguro(String(form.get('next') ?? ''))
  const email = String(form.get('email') ?? '')
  const password = String(form.get('password') ?? '')

  try {
    const secreto = secretoSesion()
    const ahora = Date.now()
    const r = await autenticar(almacenes(), email, password, ahora)
    if (!r.ok) {
      // `next` ya viene validado por destinoSeguro (sin query).
      return redirigir(`${next}?error=${r.motivo}`)
    }
    const res = redirigir(next)
    res.cookies.set(COOKIE_SESION, crearTokenSesion(r.usuario.email, ahora, secreto), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: DURACION_SESION_MS / 1000,
    })
    return res
  } catch (e) {
    console.error('[clientes] login', e)
    return noDisponible()
  }
}
