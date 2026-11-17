import { NextResponse, type NextRequest } from 'next/server'

import { destinoSeguro, origenValido } from '@/lib/clientes/http'
import { COOKIE_SESION } from '@/lib/clientes/session'

export async function POST(req: NextRequest) {
  if (!origenValido(req)) return new NextResponse('Forbidden', { status: 403 })
  const form = await req.formData()
  const res = NextResponse.redirect(
    new URL(destinoSeguro(String(form.get('next') ?? '')), req.url),
    303,
  )
  res.cookies.set(COOKIE_SESION, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 })
  return res
}
