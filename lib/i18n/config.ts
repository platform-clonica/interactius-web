/**
 * i18n config — constantes, tipos y helpers puros.
 *
 * Este archivo se importa desde server components, client components y
 * edge runtime (middleware). Nada aquí puede depender de APIs de node ni
 * de React. Solo constantes y helpers síncronos.
 */

/* ==========================================================================
   Locales
   ========================================================================== */

/**
 * Lista canónica de locales soportados.
 * El orden importa: el primero (`es`) es el default y el que se renderiza
 * sin prefijo en la URL (/contacto vs /en/contact).
 */
export const LOCALES = ['es', 'ca', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'es'

/** Type guard robusto para validar strings externos como Locale. */
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

/* ==========================================================================
   Metadatos por locale
   ========================================================================== */

interface LocaleMeta {
  /** Código BCP 47 completo (para hreflang, Open Graph, etc.) */
  htmlLang: string
  /** Nombre mostrado en el switcher */
  displayName: string
  /** Nombre en el propio idioma (para el atributo `hrefLang`) */
  nativeName: string
  /** Región principal para formateo de fecha/número */
  region: string
  /** Dirección del texto — LTR en los 3 locales actuales */
  direction: 'ltr' | 'rtl'
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  es: {
    htmlLang: 'es-ES',
    displayName: 'Español',
    nativeName: 'ES',
    region: 'ES',
    direction: 'ltr',
  },
  ca: {
    htmlLang: 'ca-ES',
    displayName: 'Català',
    nativeName: 'CA',
    region: 'ES',
    direction: 'ltr',
  },
  en: {
    htmlLang: 'en-GB',
    displayName: 'English',
    nativeName: 'EN',
    region: 'GB',
    direction: 'ltr',
  },
}

/* ==========================================================================
   Namespaces — dictionaries de UI strings
   --------------------------------------------------------------------------
   Cada namespace corresponde a una sección de la web. Los textos largos de
   copy (home, contacto, etc.) viven en lib/content/ tipados (ver Sprint 1.x).
   Aquí solo UI strings: navegación, botones, labels de form, mensajes de
   estado, errores de validación.
   ========================================================================== */

export const NAMESPACES = [
  'common', // botones globales, navegación, textos recurrentes
  'nav', // items del menú principal
  'footer', // links legales, copyright, newsletter cta
  'forms', // labels, placeholders, errors
  'meta', // SEO fallbacks por página (title, description default)
  'home', // copy específico de la página home
  'identidad', // copy de la página identidad
  'miradas', // copy de la página miradas
  'contacto', // copy de las páginas de contacto
  'capacidades', // copy de las páginas de capacidades
] as const

export type Namespace = (typeof NAMESPACES)[number]

/* ==========================================================================
   Formatos — fecha, número, lista, moneda
   --------------------------------------------------------------------------
   Se consumen con useFormatter() de next-intl en componentes.
   Ejemplo: format.dateTime(new Date(publishedAt), 'articleDate')
   ========================================================================== */

export const FORMATS = {
  dateTime: {
    /** "15 de enero de 2026" / "15 de gener de 2026" / "15 January 2026" */
    articleDate: {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
    /** "15/01/2026" */
    short: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
    /** Para <time datetime> — ISO 8601 */
    iso: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  },
  number: {
    precise: {
      maximumFractionDigits: 2,
    },
  },
  list: {
    enumeration: {
      style: 'long',
      type: 'conjunction',
    },
  },
} as const

/* ==========================================================================
   Detección de locale desde pathname (útil para middleware y helpers)
   ========================================================================== */

/**
 * Extrae el locale del pathname, o devuelve DEFAULT_LOCALE si no hay prefijo.
 * Ejemplos:
 *   /                → 'es'
 *   /contacto        → 'es'
 *   /ca              → 'ca'
 *   /ca/contacte     → 'ca'
 *   /en/contact      → 'en'
 */
export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]

  if (first && isLocale(first) && first !== DEFAULT_LOCALE) {
    return first
  }

  return DEFAULT_LOCALE
}

/**
 * Devuelve el pathname sin el prefijo de locale.
 * Útil para aplicar mapping de rutas localizadas.
 *   /ca/contacte → /contacte
 *   /en/thoughts → /thoughts
 *   /contacto    → /contacto
 */
export function stripLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]

  if (first && isLocale(first) && first !== DEFAULT_LOCALE) {
    return '/' + segments.slice(1).join('/')
  }

  return pathname
}
