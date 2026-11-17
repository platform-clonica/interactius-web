import type { NextRequest } from 'next/server'

import { adminDeLaPeticion } from '@/lib/clientes/admin-request'
import { noDisponible } from '@/lib/clientes/http'
import { normalizarEmail } from '@/lib/clientes/ids'
import { ErrorOperacion, desactivarUsuario } from '@/lib/clientes/operations'
import { redirigir } from '@/lib/clientes/redirect'

export async function POST(req: NextRequest) {
  const r = await adminDeLaPeticion(req)
  if (r instanceof Response) return r
  const form = await req.formData()
  const email = String(form.get('email') ?? '')
  if (normalizarEmail(email) === r.admin.email) {
    return redirigir('/clientes/admin?hecho=no-a-ti-mismo')
  }
  try {
    await desactivarUsuario(r.a, email, Date.now())
  } catch (e) {
    if (e instanceof ErrorOperacion) {
      return redirigir('/clientes/admin?hecho=error')
    }
    console.error('[clientes] desactivar', e)
    return noDisponible()
  }
  return redirigir('/clientes/admin?hecho=desactivado')
}
