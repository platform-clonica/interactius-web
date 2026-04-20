/**
 * Routing localizado — fuente de verdad de slugs por locale.
 *
 * Reglas:
 * - Cada ruta tiene un RouteId estable (ej. 'pensamiento').
 * - Los slugs por locale se derivan del ID, no al revés.
 * - Categorías de Miradas comparten slug en los 3 idiomas para preservar
 *   los 301 redirects ya preparados.
 * - URLs absolutas para hreflang construidas con SITE_CONFIG.baseUrl.
 */

import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
} from '@/lib/i18n/config'
import { SITE_CONFIG } from '@/lib/seo/metadata.config'

/* ==========================================================================
   Mapa de rutas localizadas
   --------------------------------------------------------------------------
   Formato:
     { es: '/ruta-es', ca: '/ruta-ca', en: '/route-en' }
   El locale default (es) va SIEMPRE sin prefijo en la URL final — eso lo
   gestiona localePrefix: 'as-needed' en defineRouting().
   ========================================================================== */

// Claves en español canónico, valores como pathnames RELATIVOS por locale.
// next-intl usa el valor del locale default como "pathname canónico" interno.
const PATHNAMES = {
  // Core pages
  '/': {
    es: '/',
    ca: '/',
    en: '/',
  },

  // Capacidades
  '/pensamiento-estrategico': {
    es: '/pensamiento-estrategico',
    ca: '/pensament-estrategic',
    en: '/strategic-thinking',
  },
  '/activacion-de-soluciones': {
    es: '/activacion-de-soluciones',
    ca: '/activacio-de-solucions',
    en: '/solution-activation',
  },
  '/transformacion-cultural': {
    es: '/transformacion-cultural',
    ca: '/transformacio-cultural',
    en: '/cultural-transformation',
  },

  // Identidad
  '/identidad': {
    es: '/identidad',
    ca: '/identitat',
    en: '/identity',
  },

  // Transaccionales
  '/contacto': {
    es: '/contacto',
    ca: '/contacte',
    en: '/contact',
  },
  // TODO Sprint 3 — añadir cuando se implementen:
  // '/newsletter': { es: '/newsletter', ca: '/newsletter', en: '/newsletter' },
  // '/testers':    { es: '/testers',    ca: '/testers',    en: '/testers' },

  // Miradas
  '/miradas': {
    es: '/miradas',
    ca: '/mirades',
    en: '/thoughts',
  },
  // Artículo — parámetros dinámicos [cat] y [slug].
  // Las categorías comparten slug en los 3 idiomas (design, ux, research, ia,
  // estrategia, workshops, diseno-inclusivo). Decisión consciente para
  // preservar los 108 redirects 301 ya preparados.
  '/miradas/[cat]/[slug]': {
    es: '/miradas/[cat]/[slug]',
    ca: '/mirades/[cat]/[slug]',
    en: '/thoughts/[cat]/[slug]',
  },

  // Legal
  '/aviso-legal': {
    es: '/aviso-legal',
    ca: '/avis-legal',
    en: '/legal-notice',
  },
} as const

/** Identificador canónico de ruta — usado en todo el código. */
export type RouteId = keyof typeof PATHNAMES

/* ==========================================================================
   next-intl routing config
   --------------------------------------------------------------------------
   - locales: lista soportada
   - defaultLocale: el que renderiza sin prefijo
   - localePrefix: 'as-needed' → prefijo solo para CA y EN
   - pathnames: mapeo localizado
   ========================================================================== */

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',
  pathnames: PATHNAMES,
})

/* ==========================================================================
   Navigation helpers (Link, redirect, usePathname, useRouter, getPathname)
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
  return getPathname({
    href: params ? { pathname: route, params } : { pathname: route },
    locale,
  })
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

/* ==========================================================================
   Exports adicionales
   ========================================================================== */

export { PATHNAMES }
