/**
 * Routing localizado — fuente de verdad de slugs por locale.
 *
 * Este archivo contiene SOLO la configuración declarativa de rutas
 * (`PATHNAMES`, `RouteId`, `routing`). Es el único módulo importado por el
 * middleware → debe permanecer 100% Edge-compatible (sin `createNavigation`,
 * sin helpers que usen `getPathname`, sin `<Link>`).
 *
 * Para `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname` y los
 * helpers derivados (`localizedPath`, `localizedUrl`, `getAlternates`,
 * `canonicalUrl`, `matchRouteId`) → ver `@/lib/i18n/navigation`.
 *
 * Reglas:
 * - Cada ruta tiene un RouteId estable (ej. 'pensamiento').
 * - Los slugs por locale se derivan del ID, no al revés.
 * - Categorías de Miradas comparten slug en los 3 idiomas para preservar
 *   los 301 redirects ya preparados.
 */

import { defineRouting } from 'next-intl/routing'

import { DEFAULT_LOCALE, LOCALES } from './config'

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
  '/diseno-de-experiencias': {
    es: '/diseno-de-experiencias',
    ca: '/disseny-d-experiencies',
    en: '/experience-design',
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
  '/newsletter': {
    es: '/newsletter',
    ca: '/newsletter',
    en: '/newsletter',
  },
  '/testers': {
    es: '/testers',
    ca: '/testers',
    en: '/testers',
  },
  // Landing de campaña — mismo slug en los 3 idiomas (nombre de evento).
  '/barcelona-design-week-2026': {
    es: '/barcelona-design-week-2026',
    ca: '/barcelona-design-week-2026',
    en: '/barcelona-design-week-2026',
  },

  // Miradas
  '/miradas': {
    es: '/miradas',
    ca: '/mirades',
    en: '/thoughts',
  },
  // Listing de madre o sub — el segmento [parentOrSub] recibe el slug
  // **localizado** (decisión D). Resolución a canónica via
  // `parseParentOrSubSlug()` en server-side.
  '/miradas/[parentOrSub]': {
    es: '/miradas/[parentOrSub]',
    ca: '/mirades/[parentOrSub]',
    en: '/thoughts/[parentOrSub]',
  },
  // Artículo — solo bajo sub (decisión A: URL solo subcategoría, sin madre).
  // El segmento [parentOrSub] aquí es siempre una sub localizada.
  '/miradas/[parentOrSub]/[slug]': {
    es: '/miradas/[parentOrSub]/[slug]',
    ca: '/mirades/[parentOrSub]/[slug]',
    en: '/thoughts/[parentOrSub]/[slug]',
  },

  // Legal
  '/aviso-legal': {
    es: '/aviso-legal',
    ca: '/avis-legal',
    en: '/legal-notice',
  },
  '/politica-privacidad': {
    es: '/politica-privacidad',
    ca: '/politica-privacitat',
    en: '/privacy-policy',
  },
  '/politica-cookies': {
    es: '/politica-cookies',
    ca: '/politica-cookies',
    en: '/cookies-policy',
  },
  '/terminos': {
    es: '/terminos',
    ca: '/termes',
    en: '/terms',
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

export { PATHNAMES }
