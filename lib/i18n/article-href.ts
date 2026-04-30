/**
 * articleHref — helper tipado para hrefs de artículos de Miradas.
 *
 * next-intl no puede inferir el tipo del href cuando se mezclan rutas
 * estáticas (string) con rutas dinámicas ({ pathname, params }) en el mismo
 * componente. Este helper encapsula la aserción de tipo en un único lugar
 * en lugar de dispersar `as any` por los componentes.
 *
 * Contexto: https://github.com/amannn/next-intl/issues/XXX
 * La función `localizedPath` en routing.ts usa el mismo patrón internamente.
 */

import { type ComponentProps } from 'react'
import { Link } from '@/lib/i18n/navigation'

/** Tipo del href que acepta el Link de next-intl */
export type IntlHref = ComponentProps<typeof Link>['href']

/**
 * Construye el href tipado para un artículo dinámico de Miradas.
 * Encapsula la aserción de tipo y evita `as any` disperso.
 */
export function articleHref(cat: string, slug: string): IntlHref {
  return {
    pathname: '/miradas/[cat]/[slug]',
    params: { cat, slug },
  } as IntlHref
}
