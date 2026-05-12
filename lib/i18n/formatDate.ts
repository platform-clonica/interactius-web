import type { Locale } from '@/lib/i18n/config'

/**
 * Formatea una fecha YYYY-MM-DD según el locale del usuario.
 *
 * Locales tag de Intl:
 *  - es → es-ES   (12 de marzo de 2026)
 *  - ca → ca-ES   (12 de març de 2026)
 *  - en → en-GB   (12 March 2026)
 *
 * Implementación canonical que reemplaza los `toLocaleDateString('es-ES', ...)`
 * hardcoded dispersos por el proyecto. Usar en cualquier sitio que muestre
 * fechas (cards de mirada, página de artículo, footer copy, etc.).
 */
export function formatDate(dateStr: string, locale: Locale): string {
  const tag = locale === 'es' ? 'es-ES' : locale === 'ca' ? 'ca-ES' : 'en-GB'
  return new Date(dateStr).toLocaleDateString(tag, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
