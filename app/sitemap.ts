import type { MetadataRoute } from 'next'

import { LOCALES } from '@/lib/i18n/config'
import { PATHNAMES, localizedUrl, type RouteId } from '@/lib/i18n/navigation'
import { getAllMiradas } from '@/lib/content/miradas'
import {
  MIRADAS_PARENT_CATEGORIES,
  MIRADAS_SUBCATEGORIES,
} from '@/lib/miradas/frontmatter.schema'
import {
  localizeParentSlug,
  localizeSubSlug,
} from '@/lib/miradas/i18n-routing'
import type { MiradasSubcategory } from '@/lib/miradas/frontmatter.schema'

/* ==========================================================================
   Sitemap dinámico
   --------------------------------------------------------------------------
   - Rutas estáticas: entradas de PATHNAMES × 3 locales.
   - Listings de madre y sub Miradas: 3 madres + 10 subs × 3 locales.
   - Artículos Miradas: 125 × 3 locales (slug del segmento parentOrSub
     localizado).
   ========================================================================== */

const STATIC_ROUTES: RouteId[] = [
  '/',
  '/pensamiento-estrategico',
  '/diseno-de-experiencias',
  '/transformacion-cultural',
  '/identidad',
  '/contacto',
  '/miradas',
]

const ROUTE_PRIORITY: Partial<Record<RouteId, number>> = {
  '/': 1.0,
  '/pensamiento-estrategico': 0.8,
  '/diseno-de-experiencias': 0.8,
  '/transformacion-cultural': 0.8,
  '/identidad': 0.8,
  '/contacto': 0.7,
  '/miradas': 0.7,
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []
  const now = new Date()

  // Rutas estáticas
  for (const routeId of STATIC_ROUTES) {
    if (!(routeId in PATHNAMES)) continue
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl(routeId, locale),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: ROUTE_PRIORITY[routeId] ?? 0.6,
      })
    }
  }

  // Listings de madre Miradas
  for (const parent of MIRADAS_PARENT_CATEGORIES) {
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl('/miradas/[parentOrSub]', locale, {
          params: { parentOrSub: localizeParentSlug(parent, locale) },
        }),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  }

  // Listings de sub Miradas
  for (const sub of MIRADAS_SUBCATEGORIES) {
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl('/miradas/[parentOrSub]', locale, {
          params: { parentOrSub: localizeSubSlug(sub, locale) },
        }),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  }

  // Artículos Miradas
  const articles = getAllMiradas()
  for (const article of articles) {
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl('/miradas/[parentOrSub]/[slug]', locale, {
          params: {
            parentOrSub: localizeSubSlug(article.category as MiradasSubcategory, locale),
            slug: article.slug,
          },
        }),
        lastModified: article.modifiedAt
          ? new Date(article.modifiedAt)
          : new Date(article.publishedAt),
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }
  }

  return entries
}
