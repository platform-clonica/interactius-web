/**
 * next-intl request config
 * --------------------------------------------------------------------------
 * next-intl auto-descubre este archivo en la raíz del proyecto.
 * Se ejecuta por request en server components y genera la config de
 * mensajes + formatos + timezone que inyecta NextIntlClientProvider.
 *
 * Docs: https://next-intl.dev/docs/usage/configuration
 */

import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

import {
  DEFAULT_LOCALE,
  FORMATS,
  LOCALES,
  NAMESPACES,
  isLocale,
  type Locale,
  type Namespace,
} from '@/lib/i18n/config'

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` puede venir como string|undefined. Resolvemos a Locale válido
  // o caemos a notFound() si es inválido (evita propagar undefined por la app).
  const requested = await requestLocale
  const locale: Locale =
    requested && isLocale(requested) ? requested : DEFAULT_LOCALE

  // Defensa extra: aunque getLocaleFromPathname y middleware deberían
  // garantizar esto, si llega un locale fuera de LOCALES disparamos 404.
  if (!LOCALES.includes(locale)) {
    notFound()
  }

  // Carga dinámica por namespace. Cada JSON contiene las UI strings de su
  // sección. Ausencia de un namespace concreto no es fatal — devolvemos {}
  // para que next-intl trate las keys como missing y pinte el fallback.
  const messages = await loadMessages(locale)

  return {
    locale,
    messages,
    formats: FORMATS,
    // Timezone fijo para servidor Barcelona. Consistencia en fechas de SSR
    // frente a fechas de cliente (evita hydration mismatches en <time>).
    timeZone: 'Europe/Madrid',
    // El now se usa para format.relativeTime() — lo fijamos por request
    // para que SSR y CSR devuelvan el mismo valor en el mismo render.
    now: new Date(),
  }
})

/* ==========================================================================
   Loader de mensajes
   ========================================================================== */

async function loadMessages(locale: Locale): Promise<Record<string, Record<string, string>>> {
  const merged: Record<string, Record<string, string>> = {}

  await Promise.all(
    NAMESPACES.map(async (ns) => {
      try {
        const mod = await import(`./messages/${locale}/${ns}.json`)
        merged[ns] = mod.default as Record<string, string>
      } catch {
        // Namespace faltante → se trata como {}.
        // En dev veremos warnings de next-intl si alguna key está ausente.
        merged[ns] = {} as Record<string, string>
      }
    }),
  )

  return merged
}

/* ==========================================================================
   Re-exports tipados (convenience)
   ========================================================================== */

export type { Locale, Namespace }
