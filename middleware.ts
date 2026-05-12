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

/**
 * Fallback de cola larga: paths con prefijos del WP antiguo cuyo slug
 * concreto no estaba en el snapshot del generador (ej. backlinks externos
 * que Google sigue siguiendo). En lugar de 404, redirigimos al listing de
 * la subcategoría más probable. Los lookups exactos del REDIRECT_MAP tienen
 * prioridad sobre estos prefijos.
 *
 * Orden importante: los prefijos más específicos (`/en/user-experience-en/`)
 * deben evaluarse antes que los más genéricos para evitar matches incorrectos.
 */
const LEGACY_PREFIX_FALLBACK: Array<[string, string]> = [
  ['/en/user-experience-en/', '/en/thoughts'],
  ['/user-experience-en/', '/miradas'],
  ['/user-experience/', '/miradas'],
  ['/design/', '/miradas/diseno-ux-ui'],
  ['/ux/', '/miradas/diseno-ux-ui'],
  ['/research/', '/miradas/ux-research'],
  ['/ia/', '/miradas/ia-aplicada'],
  ['/estrategia/', '/miradas/diseno-estrategico'],
  ['/workshops/', '/miradas/workshops'],
  ['/diseno-inclusivo/', '/miradas/diseno-ux-ui'],
]

const intlMiddleware = createMiddleware(routing)

export default function middleware(req: NextRequest) {
  // Decode el pathname antes del lookup para que sources con caracteres
  // no-ASCII (ñ, á, ü, etc.) coincidan. El browser envía %C3%B1; el Map
  // tiene 'ñ' raw como llave. Sin decodificar, fallaría el match.
  let decoded: string
  try {
    decoded = decodeURIComponent(req.nextUrl.pathname)
  } catch {
    decoded = req.nextUrl.pathname
  }
  // Normalizar trailing slash: las claves del Map están sin slash final,
  // pero Google y backlinks externos a menudo tienen trailing slash. Sin
  // esta normalización `/foo/` no matchearía nunca y daría 404.
  const normalized =
    decoded.length > 1 && decoded.endsWith('/') ? decoded.slice(0, -1) : decoded

  // 1. Lookup exacto en el Map (244 redirects del snapshot WP).
  const target = REDIRECT_MAP.get(normalized)
  if (target) {
    const url = req.nextUrl.clone()
    url.pathname = target
    return NextResponse.redirect(url, 308)
  }

  // 2. Fallback wildcard: prefijos legacy sin match exacto van al listing
  //    de la subcategoría más probable.
  for (const [prefix, dest] of LEGACY_PREFIX_FALLBACK) {
    if (normalized.startsWith(prefix)) {
      const url = req.nextUrl.clone()
      url.pathname = dest
      return NextResponse.redirect(url, 308)
    }
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
