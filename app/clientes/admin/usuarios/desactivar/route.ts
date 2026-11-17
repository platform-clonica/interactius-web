import { NextResponse, type NextRequest } from 'next/server'

import { adminDeLaPeticion } from '@/lib/clientes/admin-request'
import { noDisponible } from '@/lib/clientes/http'
import { normalizarEmail } from '@/lib/clientes/ids'
import { ErrorOperacion, desactivarUsuario } from '@/lib/clientes/operations'

export async function POST(req: NextRequest) {
  const r = await adminDeLaPeticion(req)
  if (r instanceof Response) return r
  const form = await req.formData()
  const email = String(form.get('email') ?? '')
  if (normalizarEmail(email) === r.admin.email) {
    return NextResponse.redirect(new URL('/clientes/admin?hecho=no-a-ti-mismo', req.url), 303)
  }
  try {
    await desactivarUsuario(r.a, email, Date.now())
  } catch (e) {
    if (e instanceof ErrorOperacion) {
      return NextResponse.redirect(new URL('/clientes/admin?hecho=error', req.url), 303)
    }
    console.error('[clientes] desactivar', e)
    return noDisponible()
  }
  return NextResponse.redirect(new URL('/clientes/admin?hecho=desactivado', req.url), 303)
}
