import { NextResponse } from 'next/server'

/**
 * Redirección 303 con `Location` RELATIVA.
 *
 * En Netlify, `req.url` dentro de un route handler lleva el host interno del
 * deploy (`<id>--<sitio>.netlify.app`), no el dominio público. Construir la
 * redirección con `new URL(ruta, req.url)` mandaba al usuario a ese host, donde
 * no existe la cookie de sesión (es `__Host-`, ligada al dominio público), y el
 * login nunca "pegaba". Una Location relativa la resuelve el navegador contra
 * la URL que está viendo, que siempre es la pública.
 */
export function redirigir(ruta: string): NextResponse {
  if (!ruta.startsWith('/') || ruta.startsWith('//')) {
    throw new Error(`Redirección no interna: ${ruta}`)
  }
  return new NextResponse(null, { status: 303, headers: { Location: ruta } })
}
