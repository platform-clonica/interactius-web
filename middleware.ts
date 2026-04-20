import createMiddleware from 'next-intl/middleware'

import { routing } from '@/lib/i18n/routing'

/**
 * Middleware de i18n — delega completamente en next-intl.
 *
 * Responsabilidades:
 * - Detecta el locale del request (header Accept-Language o cookie).
 * - Reescribe URLs:
 *   - /contacto → internamente /es/contacto (ES es default sin prefijo).
 *   - /ca/contacte → /ca/contacte (CA se mantiene con prefijo).
 *   - /en/contact  → /en/contact  (EN se mantiene con prefijo).
 * - Redirige a URL localizada si el usuario accede a un pathname que no
 *   corresponde a su locale detectado.
 * - Gestiona la cookie NEXT_LOCALE para persistencia entre requests.
 */
export default createMiddleware(routing)

/**
 * Config del matcher — qué paths pasan por el middleware.
 *
 * - Todo excepto: /api, /_next, /_vercel, y archivos estáticos con extensión.
 * - Incluye explícitamente /robots.txt, /sitemap.xml → No, esos los genera
 *   next directamente via app/robots.ts y app/sitemap.ts sin pasar por aquí.
 */
export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes (handled directly)
    // - Next internals
    // - Static files (anything with a dot in the last segment)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
