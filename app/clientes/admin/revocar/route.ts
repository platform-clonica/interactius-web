import type { NextRequest } from 'next/server'

import { adminDeLaPeticion } from '@/lib/clientes/admin-request'
import { noDisponible } from '@/lib/clientes/http'
import { ErrorOperacion, quitarAcceso } from '@/lib/clientes/operations'
import { redirigir } from '@/lib/clientes/redirect'

export async function POST(req: NextRequest) {
  const r = await adminDeLaPeticion(req)
  if (r instanceof Response) return r
  const form = await req.formData()
  try {
    await quitarAcceso(r.a, String(form.get('id') ?? ''), String(form.get('email') ?? ''))
  } catch (e) {
    if (e instanceof ErrorOperacion) {
      return redirigir('/clientes/admin?hecho=error')
    }
    console.error('[clientes] revocar', e)
    return noDisponible()
  }
  return redirigir('/clientes/admin?hecho=revocado')
}
