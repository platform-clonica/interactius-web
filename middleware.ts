import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'

import { miradasRedirects } from './config/miradas-redirects.mjs'
import { rootSlugRedirects } from './config/root-slug-redirects.mjs'
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
 * Mapa de slugs WP servidos a nivel raíz (`/<slug>`) → `/miradas/<cat>/<slug>`.
 * WP exponía cada post sin segmento de categoría (y también con permalink de
 * fecha `/YYYY/MM/DD/<slug>/`). Esas URLs no las recogía ni REDIRECT_MAP ni el
 * fallback de prefijos → 404. Generado por
 * `scripts/generate-root-slug-redirects.mjs` desde el contenido ES.
 */
const ROOT_SLUG_MAP = new Map<string, string>(
  rootSlugRedirects.map((r) => [r.source, r.destination]),
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
  // Prefijos cubiertos por el snapshot original (ronda 1).
  ['/en/user-experience-en/', '/en/thoughts'],
  ['/user-experience-en/', '/miradas'],
  ['/user-experience/', '/miradas/ux-research'],
  ['/es/user-experience-es/', '/miradas/ux-research'],
  ['/design/', '/miradas/diseno-ux-ui'],
  ['/ux/', '/miradas/diseno-ux-ui'],
  ['/research/', '/miradas/ux-research'],
  ['/ia/', '/miradas/ia-aplicada'],
  ['/inteligencia-artificial/', '/miradas/ia-aplicada'],
  ['/estrategia/', '/miradas/diseno-estrategico'],
  ['/workshops/', '/miradas/workshops'],
  ['/diseno-inclusivo/', '/miradas/diseno-ux-ui'],

  // Prefijos detectados en GSC ronda 2 (URLs WP legacy huérfanas).
  // Webs / disseny / diseño técnico → diseno-ux-ui.
  ['/disseny-web/', '/miradas/diseno-ux-ui'],
  ['/es/diseno-web/', '/miradas/diseno-ux-ui'],
  ['/es/desarrollo-web/', '/miradas/diseno-ux-ui'],
  ['/web/', '/miradas/diseno-ux-ui'],
  ['/ui/', '/miradas/diseno-ux-ui'],
  // "Innovacion" (sin /miradas/ prefix) — versión histórica del slug.
  ['/innovacion/', '/miradas/innovacion'],
  // Comunicación → cae al index general de miradas.
  ['/comunicacio/', '/miradas'],
  ['/es/comunicacio-es/', '/miradas'],
  // "General" del blog antiguo → miradas index (no hay sub específica).
  ['/general/', '/miradas'],
  ['/es/general-es/', '/miradas'],
  ['/en/general-en/', '/en/thoughts'],
  // Tipografía + seguridad técnica → miradas.
  ['/es/tipografias/', '/miradas/diseno-ux-ui'],
  ['/es/seguridad-2/', '/miradas'],
  // Servicios y páginas corporativas viejas.
  ['/servicios/', '/pensamiento-estrategico'],
  ['/servicios-ux/', '/pensamiento-estrategico'],
  ['/casos-de-estudio/', '/identidad'],
  ['/metodo/', '/identidad'],
  ['/equipo/', '/identidad'],
  ['/es/equipo/', '/identidad'],
  ['/laboratorio-de-usabilidad/', '/miradas/ux-research'],
  ['/outsourcing-ux/', '/pensamiento-estrategico'],
  // Página antigua de inicio duplicada.
  ['/home/', '/'],

  // Prefijos detectados en GSC ronda 3 (404 confirmados, mayo 2026).
  // Corporativas / landings viejas sin slug en el snapshot.
  ['/equipo-ux/', '/identidad'],
  ['/designtapas/', '/newsletter'],
  // '/stmdl-2/' antes que '/stmdl/' (más específico primero).
  ['/stmdl-2/', '/miradas'],
  ['/stmdl/', '/miradas'],
  ['/design-maturity/', '/pensamiento-estrategico'],
  ['/diseno-de-producto-digital/', '/diseno-de-experiencias'],
  ['/barcelona-design-week/', '/miradas'],
  ['/cursos-de-formacion', '/pensamiento-estrategico'],
  ['/workshots-ideacion-ia/', '/miradas/workshops'],
  ['/lsp/', '/miradas/workshops'],
  // Archivos WP (tags y autores) → listing general / identidad.
  ['/tag/', '/miradas'],
  ['/author/', '/identidad'],
  // Slug WP renombrado en la migración (no lo recoge ROOT_SLUG_MAP porque el
  // slug-ES actual es '-2'). Override exacto al artículo correcto.
  ['/situated-play-design/', '/miradas/diseno-estrategico/situated-play-design-2'],
]

const intlMiddleware = createMiddleware(routing)

/* ==========================================================================
   Landings de cliente — bypass de i18n (rutas públicas)
   --------------------------------------------------------------------------
   Todo lo que cuelga de `/proyectos/bershka` vive FUERA de `app/[locale]/`,
   así que hay que servirlo con `NextResponse.next()` para saltarnos el rewrite
   de next-intl (que lo mandaría a `/es/...` → 404).

   El prefijo es el cliente entero y no una landing concreta a propósito: cada
   trimestre es una ruta hermana (`future-thinking`, `future-thinking-digest-q2`,
   …) y con el prefijo antiguo, más específico, las hermanas caían en el rewrite
   y devolvían 404. Añadir un trimestre nuevo ya no obliga a tocar este archivo.

   Estas páginas eran privadas (HTTP Basic Auth); se hicieron públicas a
   petición, así que solo queda el bypass de i18n, sin comprobar credenciales.

   Las env vars `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` ya no se usan aquí; se
   pueden borrar del dashboard de Netlify. Se mantienen en `SECRETS_SCAN_OMIT_KEYS`
   (netlify.toml) de forma inofensiva por si el valor aún estuviera configurado.
   ========================================================================== */
const APPROOT_BYPASS_PREFIX = '/proyectos/bershka'

function isAppRootBypass(pathname: string): boolean {
  return (
    pathname === APPROOT_BYPASS_PREFIX ||
    pathname.startsWith(`${APPROOT_BYPASS_PREFIX}/`)
  )
}

export default function middleware(req: NextRequest) {
  // 0. Ruta app-root fuera de i18n → servir directamente, sin rewrite de
  //    next-intl. El resto del middleware queda intacto.
  if (isAppRootBypass(req.nextUrl.pathname)) {
    return NextResponse.next()
  }

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
  //    de la subcategoría más probable. Acepta tanto el prefijo exacto
  //    sin slash final (ej. '/metodo') como cualquier path bajo él
  //    (ej. '/metodo/foo/bar').
  for (const [prefix, dest] of LEGACY_PREFIX_FALLBACK) {
    const prefixNoSlash = prefix.slice(0, -1)
    if (normalized === prefixNoSlash || normalized.startsWith(prefix)) {
      const url = req.nextUrl.clone()
      url.pathname = dest
      return NextResponse.redirect(url, 308)
    }
  }

  // 3. Slugs WP a nivel raíz (`/<slug>` y permalink de fecha
  //    `/YYYY/MM/DD/<slug>`) → URL canónica `/miradas/<cat>/<slug>`. Primero
  //    pelamos un posible prefijo de fecha y luego consultamos el mapa.
  const dateStripped = normalized.replace(
    /^\/\d{4}\/\d{2}\/\d{2}(\/.+)$/,
    '$1',
  )
  const rootTarget = ROOT_SLUG_MAP.get(dateStripped)
  if (rootTarget) {
    const url = req.nextUrl.clone()
    url.pathname = rootTarget
    return NextResponse.redirect(url, 308)
  }

  // 4. Trailing slash → no slash (excepto root '/'): 301 a la versión canónica.
  //    El sitemap declara todas las URLs sin slash final; con esto evitamos
  //    el "Duplicate sin canonical seleccionado" que GSC reportaba por servir
  //    el mismo contenido en /miradas/ y /miradas con 200 ambos.
  if (decoded.length > 1 && decoded.endsWith('/')) {
    const url = req.nextUrl.clone()
    url.pathname = decoded.slice(0, -1)
    return NextResponse.redirect(url, 301)
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
