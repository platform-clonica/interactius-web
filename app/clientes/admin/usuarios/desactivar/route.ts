import { NextResponse, type NextRequest } from 'next/server'

import { adminDeLaPeticion } from '@/lib/clientes/admin-request'
import { noDisponible } from '@/lib/clientes/http'
import { desactivarUsuario } from '@/lib/clientes/operations'

export async function POST(req: NextRequest) {
  const r = await adminDeLaPeticion(req)
  if (r instanceof Response) return r
  const form = await req.formData()
  const email = String(form.get('email') ?? '')
  if (email === r.admin.email) {
    return NextResponse.redirect(new URL('/clientes/admin?hecho=no-a-ti-mismo', req.url), 303)
  }
  try {
    await desactivarUsuario(r.a, email, Date.now())
  } catch (e) {
    console.error('[clientes] desactivar', e)
    return noDisponible()
  }
  return NextResponse.redirect(new URL('/clientes/admin?hecho=desactivado', req.url), 303)
}
