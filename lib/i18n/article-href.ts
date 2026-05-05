/**
 * articleHref — helper tipado para hrefs de artículos y listings de Miradas.
 *
 * Encapsula la lógica de slug localizado: para Miradas v2 los segmentos
 * `[parentOrSub]` cambian por locale. Quien construya un Link a un artículo
 * o listing debe pasar el `Locale` para resolver el slug correcto.
 */

import { type ComponentProps } from 'react'
import { Link } from '@/lib/i18n/navigation'
import type { Locale } from '@/lib/i18n/config'
import {
  localizeSubSlug,
  localizeParentSlug,
} from '@/lib/miradas/i18n-routing'
import type {
  MiradasParentCategory,
  MiradasSubcategory,
} from '@/lib/miradas/frontmatter.schema'

/** Tipo del href que acepta el Link de next-intl */
export type IntlHref = ComponentProps<typeof Link>['href']

/**
 * Construye el href de un artículo. Pasa la sub canónica + slug del .mdx;
 * el helper se encarga de localizar el slug del segmento URL al locale.
 */
export function articleHref(
  sub: MiradasSubcategory,
  slug: string,
  locale: Locale,
): IntlHref {
  return {
    pathname: '/miradas/[parentOrSub]/[slug]',
    params: { parentOrSub: localizeSubSlug(sub, locale), slug },
  } as IntlHref
}

/**
 * Construye el href del listing de una sub. Pasa la sub canónica.
 */
export function subListingHref(
  sub: MiradasSubcategory,
  locale: Locale,
): IntlHref {
  return {
    pathname: '/miradas/[parentOrSub]',
    params: { parentOrSub: localizeSubSlug(sub, locale) },
  } as IntlHref
}

/**
 * Construye el href del listing de una madre. Pasa la madre canónica.
 */
export function parentListingHref(
  parent: MiradasParentCategory,
  locale: Locale,
): IntlHref {
  return {
    pathname: '/miradas/[parentOrSub]',
    params: { parentOrSub: localizeParentSlug(parent, locale) },
  } as IntlHref
}
