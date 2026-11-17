import type { NextRequest } from 'next/server'

import { usuarioDeSesion } from './access'
import { almacenes, secretoSesion } from './config'
import { CABECERAS_PRIVADAS, noDisponible, origenValido } from './http'
import { COOKIE_SESION } from './session'
import type { Almacenes } from './store'
import type { Usuario } from './types'

/** Origen válido + sesión de admin, o la Response de error a devolver. */
export async function adminDeLaPeticion(
  req: NextRequest,
): Promise<{ a: Almacenes; admin: Usuario } | Response> {
  if (!origenValido(req)) return new Response('Forbidden', { status: 403, headers: CABECERAS_PRIVADAS })
  try {
    const a = almacenes()
    const usuario = await usuarioDeSesion(a, req.cookies.get(COOKIE_SESION)?.value, Date.now(), secretoSesion())
    if (!usuario?.admin) return new Response('Forbidden', { status: 403, headers: CABECERAS_PRIVADAS })
    return { a, admin: usuario }
  } catch (e) {
    console.error('[clientes] admin', e)
    return noDisponible()
  }
}
