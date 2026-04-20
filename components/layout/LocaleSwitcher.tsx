'use client'

import { useParams } from 'next/navigation'

import {
  LOCALES,
  LOCALE_META,
  type Locale,
} from '@/lib/i18n/config'
import { Link, usePathname } from '@/lib/i18n/routing'

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

  return (
    <ul
      className={`flex items-center gap-3 font-mono text-micro ${className ?? ''}`}
      aria-label="Language"
    >
      {LOCALES.map((locale) => {
        const isCurrent = locale === currentLocale
        return (
          <li key={locale}>
            {isCurrent ? (
              <span
                aria-current="true"
                className="uppercase text-fg"
              >
                {LOCALE_META[locale].nativeName}
              </span>
            ) : (
              <Link
                href={pathname}
                locale={locale}
                className="uppercase text-fg/60 transition-colors duration-fast ease-expo
                           hover:text-fg focus-visible:text-fg"
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
