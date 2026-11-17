'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

import { usuarioDeSesion } from '@/lib/clientes/access'
import { almacenes, secretoSesion } from '@/lib/clientes/config'
import { darAccesoPanel, type ResultadoDarAcceso } from '@/lib/clientes/panel'
import { COOKIE_SESION } from '@/lib/clientes/session'
import { SITE_CONFIG } from '@/lib/seo/metadata.config'

/**
 * Server action del formulario «Dar acceso» del panel. Next ya rechaza las
 * server actions cuyo Origin no coincide con el host (CSRF); aquí se vuelve a
 * comprobar la sesión de admin en cada llamada.
 */
export async function darAccesoAccion(
  _anterior: ResultadoDarAcceso | null,
  form: FormData,
): Promise<ResultadoDarAcceso> {
  try {
    const a = almacenes()
    const ahora = Date.now()
    const token = (await cookies()).get(COOKIE_SESION)?.value
    const admin = await usuarioDeSesion(a, token, ahora, secretoSesion())
    if (!admin?.admin) return { ok: false, mensaje: 'Tu sesión ha caducado. Vuelve a entrar.' }

    const r = await darAccesoPanel(
      a,
      String(form.get('id') ?? ''),
      String(form.get('email') ?? ''),
      ahora,
      SITE_CONFIG.baseUrl,
    )
    if (r.ok) revalidatePath('/clientes/admin')
    return r
  } catch (e) {
    console.error('[clientes] dar acceso (panel)', e)
    return { ok: false, mensaje: 'Servicio no disponible. Inténtalo de nuevo en unos minutos.' }
  }
}
