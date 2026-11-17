import { type NextRequest } from 'next/server'

import { adminDeLaPeticion } from '@/lib/clientes/admin-request'
import { CABECERAS_PRIVADAS } from '@/lib/clientes/http'
import { darAccesoPanel, type ResultadoDarAcceso } from '@/lib/clientes/panel'
import { SITE_CONFIG } from '@/lib/seo/metadata.config'

export const dynamic = 'force-dynamic'

/**
 * «Dar acceso» del panel admin. Ruta normal (no server action): en Netlify
 * la server action se quedaba colgada hasta el 504; las rutas de revocar y
 * desactivar, con este mismo patrón, funcionan. Responde JSON para que el
 * formulario muestre la contraseña una sola vez sin recargar la página.
 */
export async function POST(req: NextRequest) {
  const r = await adminDeLaPeticion(req)
  if (r instanceof Response) {
    const mensaje =
      r.status === 403 ? 'Tu sesión ha caducado. Vuelve a entrar.' : 'Servicio no disponible. Inténtalo de nuevo en unos minutos.'
    return json({ ok: false, mensaje }, r.status)
  }

  let id = ''
  let email = ''
  try {
    const form = await req.formData()
    id = String(form.get('id') ?? '')
    email = String(form.get('email') ?? '')
  } catch {
    return json({ ok: false, mensaje: 'Petición no válida.' }, 400)
  }

  try {
    return json(await darAccesoPanel(r.a, id, email, Date.now(), SITE_CONFIG.baseUrl))
  } catch (e) {
    console.error('[clientes] dar acceso (panel)', e)
    return json({ ok: false, mensaje: 'Servicio no disponible. Inténtalo de nuevo en unos minutos.' }, 503)
  }
}

function json(cuerpo: ResultadoDarAcceso, status = 200) {
  return Response.json(cuerpo, { status, headers: CABECERAS_PRIVADAS })
}
