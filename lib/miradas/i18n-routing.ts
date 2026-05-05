/**
 * Routing localizado para la taxonomía Miradas v2.
 *
 * Las URLs solo llevan la **subcategoría** (decisión A): `/miradas/<sub>/<slug>`.
 * Los slugs de madre y de sub son **localizados** (decisión D): para CA y EN
 * el slug del segmento `[parentOrSub]` cambia.
 *
 * Este archivo expone:
 *   - Los mapas canónico → localizado por locale.
 *   - Helpers `localize*` y `delocalize*` (función inversa).
 *   - Display labels localizadas para UI.
 *
 * Las constantes canónicas (slugs ES) viven en
 * `lib/miradas/frontmatter.schema.ts` y son la fuente de verdad.
 */

import type { Locale } from '@/lib/i18n/config'
import {
  MIRADAS_PARENT_CATEGORIES,
  MIRADAS_SUBCATEGORIES,
  type MiradasParentCategory,
  type MiradasSubcategory,
} from '@/lib/miradas/frontmatter.schema'

// ─── Slugs por locale ─────────────────────────────────────────────────

/** Madre canónica → slug localizado por locale. */
export const PARENT_SLUG_BY_LOCALE: Record<
  Locale,
  Record<MiradasParentCategory, string>
> = {
  es: {
    'pensamiento-estrategico': 'pensamiento-estrategico',
    'diseno-experiencias': 'diseno-experiencias',
    'transformacion-cultural': 'transformacion-cultural',
  },
  ca: {
    'pensamiento-estrategico': 'pensament-estrategic',
    'diseno-experiencias': 'disseny-experiencies',
    'transformacion-cultural': 'transformacio-cultural',
  },
  en: {
    'pensamiento-estrategico': 'strategic-thinking',
    'diseno-experiencias': 'experience-design',
    'transformacion-cultural': 'cultural-transformation',
  },
}

/** Sub canónica → slug localizado por locale. */
export const SUB_SLUG_BY_LOCALE: Record<
  Locale,
  Record<MiradasSubcategory, string>
> = {
  es: {
    'diseno-estrategico': 'diseno-estrategico',
    innovacion: 'innovacion',
    futuros: 'futuros',
    marca: 'marca',
    'diseno-ux-ui': 'diseno-ux-ui',
    'ux-research': 'ux-research',
    clonica: 'clonica',
    'ia-aplicada': 'ia-aplicada',
    'cultura-organizacional': 'cultura-organizacional',
    workshops: 'workshops',
  },
  ca: {
    'diseno-estrategico': 'disseny-estrategic',
    innovacion: 'innovacio',
    futuros: 'futurs',
    marca: 'marca',
    'diseno-ux-ui': 'disseny-ux-ui',
    'ux-research': 'ux-research',
    clonica: 'clonica',
    'ia-aplicada': 'ia-aplicada',
    'cultura-organizacional': 'cultura-organitzacional',
    workshops: 'workshops',
  },
  en: {
    'diseno-estrategico': 'strategic-design',
    innovacion: 'innovation',
    futuros: 'futures',
    marca: 'brand',
    'diseno-ux-ui': 'ux-ui-design',
    'ux-research': 'ux-research',
    clonica: 'clonica',
    'ia-aplicada': 'applied-ai',
    'cultura-organizacional': 'organizational-culture',
    workshops: 'workshops',
  },
}

// ─── Localize / Delocalize ─────────────────────────────────────────────

export function localizeSubSlug(
  canonical: MiradasSubcategory,
  locale: Locale,
): string {
  return SUB_SLUG_BY_LOCALE[locale][canonical]
}

export function delocalizeSubSlug(
  localized: string,
  locale: Locale,
): MiradasSubcategory | null {
  const map = SUB_SLUG_BY_LOCALE[locale]
  for (const sub of MIRADAS_SUBCATEGORIES) {
    if (map[sub] === localized) return sub
  }
  return null
}

export function localizeParentSlug(
  canonical: MiradasParentCategory,
  locale: Locale,
): string {
  return PARENT_SLUG_BY_LOCALE[locale][canonical]
}

export function delocalizeParentSlug(
  localized: string,
  locale: Locale,
): MiradasParentCategory | null {
  const map = PARENT_SLUG_BY_LOCALE[locale]
  for (const p of MIRADAS_PARENT_CATEGORIES) {
    if (map[p] === localized) return p
  }
  return null
}

/**
 * Dado un slug que viene del segmento `[parentOrSub]` del path, decide si es
 * una madre o una sub y devuelve la versión canónica.
 */
export type ParseResult =
  | { kind: 'parent'; canonical: MiradasParentCategory }
  | { kind: 'sub'; canonical: MiradasSubcategory }
  | null

export function parseParentOrSubSlug(
  localized: string,
  locale: Locale,
): ParseResult {
  const sub = delocalizeSubSlug(localized, locale)
  if (sub) return { kind: 'sub', canonical: sub }
  const parent = delocalizeParentSlug(localized, locale)
  if (parent) return { kind: 'parent', canonical: parent }
  return null
}

// ─── Display labels (i18n para UI) ─────────────────────────────────────

export const PARENT_DISPLAY: Record<
  Locale,
  Record<MiradasParentCategory, string>
> = {
  es: {
    'pensamiento-estrategico': 'Pensamiento Estratégico',
    'diseno-experiencias': 'Diseño de Experiencias',
    'transformacion-cultural': 'Transformación Cultural',
  },
  ca: {
    'pensamiento-estrategico': 'Pensament Estratègic',
    'diseno-experiencias': "Disseny d'Experiències",
    'transformacion-cultural': 'Transformació Cultural',
  },
  en: {
    'pensamiento-estrategico': 'Strategic Thinking',
    'diseno-experiencias': 'Experience Design',
    'transformacion-cultural': 'Cultural Transformation',
  },
}

export const SUB_DISPLAY: Record<Locale, Record<MiradasSubcategory, string>> = {
  es: {
    'diseno-estrategico': 'Diseño estratégico',
    innovacion: 'Innovación',
    futuros: 'Futuros',
    marca: 'Marca',
    'diseno-ux-ui': 'Diseño UX/UI',
    'ux-research': 'UX Research',
    clonica: 'Clónica',
    'ia-aplicada': 'Inteligencia Artificial aplicada',
    'cultura-organizacional': 'Cultura organizacional',
    workshops: 'Workshops',
  },
  ca: {
    'diseno-estrategico': 'Disseny estratègic',
    innovacion: 'Innovació',
    futuros: 'Futurs',
    marca: 'Marca',
    'diseno-ux-ui': 'Disseny UX/UI',
    'ux-research': 'UX Research',
    clonica: 'Clónica',
    'ia-aplicada': 'Intel·ligència Artificial aplicada',
    'cultura-organizacional': 'Cultura organitzacional',
    workshops: 'Workshops',
  },
  en: {
    'diseno-estrategico': 'Strategic Design',
    innovacion: 'Innovation',
    futuros: 'Futures',
    marca: 'Brand',
    'diseno-ux-ui': 'UX/UI Design',
    'ux-research': 'UX Research',
    clonica: 'Clónica',
    'ia-aplicada': 'Applied AI',
    'cultura-organizacional': 'Organizational Culture',
    workshops: 'Workshops',
  },
}
