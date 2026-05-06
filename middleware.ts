import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'

import { miradasRedirects } from './config/miradas-redirects.mjs'
import { routing } from './lib/i18n/routing'

/**
 * Middleware combinado: legacy redirects 301 + i18n de next-intl.
 *
 * Por qué los redirects van AQUÍ y no en `next.config.mjs#redirects()`:
 * en Netlify (con @netlify/plugin-nextjs), el rewrite que hace el middleware
 * de next-intl (`/foo` → `/es/foo`) se aplicaba ANTES que los `redirects()`
 * declarados en `next.config`, lo que dejaba los 244 redirects 301 muertos
 * en producción (devolvían 404). En `next start` local el orden era el
 * contrario y funcionaba — desincronización del plugin de Netlify.
 *
 * Solución: lookup O(1) en un Map al principio del middleware. Si el
 * pathname coincide con un source legacy, devolvemos NextResponse.redirect
 * 308 sin pasar por next-intl. Si no, delegamos al middleware de i18n
 * normal.
 *
 * El Map se construye una sola vez en cold-start de la edge function.
 * 244 entries × ~80 bytes = ~20 kB en memoria, irrelevante.
 */
const REDIRECT_MAP = new Map<string, string>(
  miradasRedirects.map((r) => [r.source, r.destination]),
)

const intlMiddleware = createMiddleware(routing)

export default function middleware(req: NextRequest) {
  const target = REDIRECT_MAP.get(req.nextUrl.pathname)
  if (target) {
    const url = req.nextUrl.clone()
    url.pathname = target
    return NextResponse.redirect(url, 308)
  }
  return intlMiddleware(req)
}

/**
 * Config del matcher — qué paths pasan por el middleware.
 *
 * - Todo excepto: /api, /_next, /_vercel, y archivos estáticos con extensión.
 * - Robots.txt y sitemap.xml los genera Next directamente vía
 *   app/robots.ts y app/sitemap.ts; al tener extensión, no caen aquí.
 */
export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
