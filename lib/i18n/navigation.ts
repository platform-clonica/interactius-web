/**
 * Navigation helpers — locale-aware `<Link>`, `redirect`, hooks, y helpers
 * derivados (URLs absolutas, hreflang alternates, etc.).
 *
 * Importa de aquí en cualquier componente cliente/servidor o helper de SEO.
 * El middleware NO debe importar de este archivo — usa `@/lib/i18n/routing`,
 * que es Edge-safe y sólo expone la config declarativa.
 */

import { createNavigation } from 'next-intl/navigation'

import { type Locale, LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'
import { SITE_CONFIG } from '@/lib/seo/metadata.config'
import { PATHNAMES, type RouteId, routing } from '@/lib/i18n/routing'

/* ==========================================================================
   next-intl navigation primitives
   --------------------------------------------------------------------------
   Estos son los que los componentes deben usar — NO `import Link from 'next/link'`.
   Los de next-intl son locale-aware y traducen el href automáticamente.
   ========================================================================== */

export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing)

/* ==========================================================================
   Re-exports — para que la mayoría de call sites puedan importar todo
   desde un único módulo (`@/lib/i18n/navigation`).
   ========================================================================== */

export { PATHNAMES, type RouteId }

/* ==========================================================================
   Helpers derivados — URLs absolutas para SEO / metadata
   ========================================================================== */

interface LocalizedPathParams {
  /** Parámetros dinámicos si la ruta los requiere (ej. cat, slug). */
  params?: Record<string, string>
}

/**
 * Devuelve el pathname localizado RELATIVO para una ruta canónica en un locale.
 * Ejemplos:
 *   localizedPath('/contacto', 'ca')
 *   → '/ca/contacte'
 *   localizedPath('/miradas/[cat]/[slug]', 'en', { params: { cat: 'design', slug: 'foo' } })
 *   → '/en/thoughts/design/foo'
 */
export function localizedPath(
  route: RouteId,
  locale: Locale,
  { params }: LocalizedPathParams = {},
): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const href: any = params ? { pathname: route, params } : route
  return getPathname({ href, locale })
}

/**
 * Devuelve la URL absoluta (con dominio) para una ruta canónica en un locale.
 * Usada para hreflang y Open Graph.
 */
export function localizedUrl(
  route: RouteId,
  locale: Locale,
  options: LocalizedPathParams = {},
): string {
  const pathname = localizedPath(route, locale, options)
  return `${SITE_CONFIG.baseUrl}${pathname}`
}

/**
 * Devuelve el mapa completo de URLs alternativas para hreflang.
 * Clave: htmlLang (es-ES, ca-ES, en-GB). Valor: URL absoluta.
 * Incluye x-default apuntando al locale por defecto.
 */
export function getAlternates(
  route: RouteId,
  options: LocalizedPathParams = {},
): Record<string, string> {
  const alternates: Record<string, string> = {}

  for (const locale of LOCALES) {
    const url = localizedUrl(route, locale, options)
    // next/metadata usa el código de 2 letras como key — mantenemos ese formato.
    alternates[locale] = url
  }

  // x-default → la versión del locale por defecto
  alternates['x-default'] = localizedUrl(route, DEFAULT_LOCALE, options)

  return alternates
}

/**
 * Devuelve la URL canónica absoluta (self-referential) para una página.
 * Útil para `alternates.canonical` en metadata.
 */
export function canonicalUrl(
  route: RouteId,
  locale: Locale,
  options: LocalizedPathParams = {},
): string {
  return localizedUrl(route, locale, options)
}

/* ==========================================================================
   Inferencia inversa: pathname → RouteId
   --------------------------------------------------------------------------
   Caso de uso: hreflang para páginas dinámicas donde solo tenemos el pathname.
   Recorre el mapa y compara normalizado por locale.
   ========================================================================== */

/**
 * Dado un pathname actual (ya sin prefijo de locale), devuelve el RouteId
 * canónico si coincide con alguna entrada del mapa.
 *
 * Matching:
 * - Para rutas estáticas: comparación exacta.
 * - Para rutas dinámicas: reemplaza [param] por regex y hace match.
 *
 * Devuelve `null` si no hay match (404 o ruta no mapeada).
 */
export function matchRouteId(
  pathname: string,
  locale: Locale,
): { routeId: RouteId; params: Record<string, string> } | null {
  const normalized = pathname.startsWith('/') ? pathname : '/' + pathname

  for (const routeId of Object.keys(PATHNAMES) as RouteId[]) {
    const pattern = PATHNAMES[routeId][locale]

    if (!pattern.includes('[')) {
      // Ruta estática
      if (pattern === normalized) {
        return { routeId, params: {} }
      }
      continue
    }

    // Ruta dinámica — construye regex desde el patrón
    const paramNames: string[] = []
    const regexSource = pattern.replace(/\[([^\]]+)\]/g, (_, name: string) => {
      paramNames.push(name)
      return '([^/]+)'
    })
    const regex = new RegExp(`^${regexSource}$`)
    const match = normalized.match(regex)

    if (match) {
      const params: Record<string, string> = {}
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1]
      })
      return { routeId, params }
    }
  }

  return null
}
