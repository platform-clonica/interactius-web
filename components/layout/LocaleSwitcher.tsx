'use client'

import { useParams } from 'next/navigation'

import {
  LOCALES,
  LOCALE_META,
  type Locale,
} from '@/lib/i18n/config'
import { Link, usePathname } from '@/lib/i18n/navigation'
import type { RouteId } from '@/lib/i18n/navigation'
import { articleHref, type IntlHref } from '@/lib/i18n/article-href'

/**
 * LocaleSwitcher — 3 botones ES / CA / EN en línea.
 *
 * Estrategia: usamos usePathname() de next-intl que devuelve el pathname
 * CANÓNICO (sin prefijo, antes de localizar). Al pasarle el mismo pathname
 * canónico al <Link> con locale distinto, next-intl traduce al slug del locale
 * destino automáticamente.
 *
 * Si la ruta actual tiene params dinámicos (Miradas article), el pathname
 * canónico ya los incluye como segmentos concretos — no necesitamos
 * manipularlos manualmente.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const pathname = usePathname()
  const params = useParams()
  const currentLocale = (params.locale as Locale) ?? 'es'

  // Para rutas de artículo dinámicas, next-intl necesita el template + params,
  // no el path concreto. Detectamos por la presencia de cat + slug en useParams.
  const cat = params.cat as string | undefined
  const slug = params.slug as string | undefined
  const isDynamicArticle = Boolean(cat && slug)

  // articleHref() encapsula la aserción de tipo necesaria para rutas dinámicas
  // de next-intl. Ver lib/i18n/article-href.ts para contexto.
  const linkHref: IntlHref = isDynamicArticle
    ? articleHref(cat!, slug!)
    : (pathname as Exclude<RouteId, '/miradas/[cat]/[slug]'>)

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
              <span
                aria-current="true"
                className="uppercase text-fg/40"
              >
                {LOCALE_META[locale].nativeName}
              </span>
            ) : (
              <Link
                href={linkHref}
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
