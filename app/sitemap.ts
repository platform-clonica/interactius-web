import type { MetadataRoute } from 'next'

import { LOCALES } from '@/lib/i18n/config'
import { PATHNAMES, localizedUrl, type RouteId } from '@/lib/i18n/navigation'
import { getAllSlugs } from '@/lib/content/miradas'

/* ==========================================================================
   Sitemap dinámico
   --------------------------------------------------------------------------
   - Rutas estáticas: todas las entradas de PATHNAMES × 3 locales.
   - Rutas dinámicas: artículos Miradas × 3 locales.
   - Excluidas: /newsletter (transaccional), /aviso-legal (legal, baja prioridad).
   ========================================================================== */

/** Rutas estáticas que deben aparecer en el sitemap. */
const STATIC_ROUTES: RouteId[] = [
  '/',
  '/pensamiento-estrategico',
  '/diseno-de-experiencias',
  '/transformacion-cultural',
  '/identidad',
  '/contacto',
  '/miradas',
]

/** Prioridad por ruta canónica. */
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

  // ── Rutas estáticas ────────────────────────────────────────────────────────
  for (const routeId of STATIC_ROUTES) {
    // Asegurar que la ruta existe en PATHNAMES (typeguard en runtime)
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

  // ── Artículos Miradas (dinámicos) ──────────────────────────────────────────
  const slugs = getAllSlugs()
  for (const { cat, slug } of slugs) {
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl('/miradas/[cat]/[slug]', locale, {
          params: { cat, slug },
        }),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  }

  return entries
}
