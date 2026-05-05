'use client'

import { useParams } from 'next/navigation'

import {
  LOCALES,
  LOCALE_META,
  type Locale,
} from '@/lib/i18n/config'
import { Link, usePathname } from '@/lib/i18n/navigation'
import type { RouteId } from '@/lib/i18n/navigation'
import {
  articleHref,
  parentListingHref,
  subListingHref,
  type IntlHref,
} from '@/lib/i18n/article-href'
import { parseParentOrSubSlug } from '@/lib/miradas/i18n-routing'

/**
 * LocaleSwitcher — 3 botones ES / CA / EN en línea.
 *
 * Para rutas de Miradas con segmentos localizados ([parentOrSub], opcional
 * [slug]), construimos el href con la versión LOCALIZADA al locale destino.
 * El segmento `parentOrSub` cambia por idioma, así que no podemos pasar el
 * pathname tal cual a Link con `locale={target}` — necesitamos relocalizar.
 *
 * Para el resto de rutas (estáticas o sin slug localizado), `usePathname()`
 * devuelve el path canónico que `Link` traduce automáticamente.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const pathname = usePathname()
  const params = useParams()
  const currentLocale = (params.locale as Locale) ?? 'es'

  const parentOrSub = params.parentOrSub as string | undefined
  const slug = params.slug as string | undefined

  /**
   * Build el href para un locale target. Las rutas Miradas dinámicas requieren
   * relocalización del segmento parentOrSub.
   */
  function hrefForLocale(target: Locale): IntlHref {
    if (parentOrSub) {
      const parsed = parseParentOrSubSlug(parentOrSub, currentLocale)
      if (parsed) {
        if (slug && parsed.kind === 'sub') {
          return articleHref(parsed.canonical, slug, target)
        }
        if (parsed.kind === 'sub') {
          return subListingHref(parsed.canonical, target)
        }
        if (parsed.kind === 'parent') {
          return parentListingHref(parsed.canonical, target)
        }
      }
    }
    // Resto de rutas — pathname canónico, next-intl traduce al locale destino.
    return pathname as Exclude<
      RouteId,
      '/miradas/[parentOrSub]' | '/miradas/[parentOrSub]/[slug]'
    >
  }

  return (
    <ul
      className={`flex flex-col items-end gap-1 font-mono text-body-sm ${className ?? ''}`}
      aria-label="Language"
    >
      {LOCALES.map((locale) => {
        const isCurrent = locale === currentLocale
        return (
          <li key={locale}>
            {isCurrent ? (
              <span aria-current="true" className="uppercase text-fg/40">
                {LOCALE_META[locale].nativeName}
              </span>
            ) : (
              <Link
                href={hrefForLocale(locale)}
                locale={locale}
                className="hover-wipe-underline w-fit uppercase text-fg
                           focus-visible:opacity-90"
              >
                {LOCALE_META[locale].nativeName}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}
