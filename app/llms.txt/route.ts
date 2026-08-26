import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { localizedUrl } from '@/lib/i18n/navigation'
import { PAGE_COPY, SITE_CONFIG } from '@/lib/seo/metadata.config'
import { getAllMiradas } from '@/lib/content/miradas'
import { PARENT_DISPLAY, localizeSubSlug } from '@/lib/miradas/i18n-routing'
import {
  MIRADAS_PARENT_CATEGORIES,
  type MiradasParentCategory,
  type MiradasSubcategory,
} from '@/lib/miradas/frontmatter.schema'
import capacidadesEs from '@/messages/es/capacidades.json'

/* ==========================================================================
   /llms.txt
   --------------------------------------------------------------------------
   Índice curado del sitio en Markdown para agentes de IA (estándar llms.txt,
   https://llmstxt.org). Da a los modelos un mapa limpio del contenido sin
   tener que parsear el HTML animado del sitio.

   - Se genera dinámicamente desde las mismas fuentes que el sitemap y la
     metadata (SITE_CONFIG, PAGE_COPY, getAllMiradas) → se mantiene solo.
   - URLs en la locale por defecto (ES, sin prefijo), que es la canónica.
     Para CA/EN, prefijar la ruta con /ca o /en.
   - El middleware excluye rutas con extensión (.txt), así que esta ruta no
     pasa por el rewrite de next-intl.
   ========================================================================== */

// Cachea la respuesta como estática (se revalida en cada build/deploy).
export const dynamic = 'force-static'

/** Escapa saltos de línea internos de descripciones para no romper la lista. */
function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * El copy de `capacidades.json` lleva HTML inline (`<strong>`, `<p>`). Lo
 * quitamos y colapsamos a una sola línea para el Markdown del llms.txt.
 */
function stripHtml(text: string): string {
  return oneLine(text.replace(/<[^>]+>/g, ' ')).replace(/\s+([.,;:!?])/g, '$1')
}

/** Una entrada de lista Markdown: `- [name](url): description`. */
function link(name: string, url: string, description?: string): string {
  const desc = description ? `: ${oneLine(description)}` : ''
  return `- [${name}](${url})${desc}`
}

function buildBody(): string {
  const locale = DEFAULT_LOCALE
  const lines: string[] = []

  const home = PAGE_COPY['/'][locale]

  // ── Cabecera (título + resumen en blockquote, según el estándar) ──────────
  lines.push(`# ${SITE_CONFIG.name}`)
  lines.push('')
  lines.push(`> ${oneLine(home.description)}`)
  lines.push('')
  lines.push(
    oneLine(
      `Interactius es una consultora de diseño estratégico con sede en ` +
        `${SITE_CONFIG.address.city} (fundada en 2012). Trabajamos en la ` +
        `intersección de estrategia, diseño de experiencias, transformación ` +
        `cultural e inteligencia artificial aplicada, ayudando a las ` +
        `organizaciones a tomar mejores decisiones en contextos de incertidumbre.`,
    ),
  )
  lines.push('')
  lines.push(
    oneLine(
      `El sitio está disponible en español (ES, por defecto), catalán (CA) y ` +
        `inglés (EN). Las URLs de este archivo apuntan a la versión española, ` +
        `que es la canónica; para CA o EN, prefija la ruta con /ca o /en.`,
    ),
  )
  lines.push('')

  // ── Servicios (las 3 áreas, con detalle y sub-servicios) ──────────────────
  // El detalle sale de messages/es/capacidades.json (misma fuente que la UI),
  // así se mantiene solo si cambia el copy de las páginas de servicios.
  const SERVICE_AREAS = [
    { routeId: '/pensamiento-estrategico', key: 'pensamiento' },
    { routeId: '/diseno-de-experiencias', key: 'experiencias' },
    { routeId: '/transformacion-cultural', key: 'transformacion' },
  ] as const

  lines.push('## Servicios')
  lines.push('')
  lines.push(
    oneLine(
      `Interactius estructura su trabajo en tres áreas de servicio ` +
        `complementarias. Cada una agrupa varios servicios concretos.`,
    ),
  )
  lines.push('')

  for (const { routeId, key } of SERVICE_AREAS) {
    const area = capacidadesEs[key]
    const title = PAGE_COPY[routeId][locale].title
    const url = localizedUrl(routeId, locale)

    lines.push(`### [${title}](${url})`)
    lines.push('')
    // Párrafo introductorio: lead (posicionamiento) + statement (propuesta).
    lines.push(
      oneLine(`${stripHtml(area.hero.lead)} ${stripHtml(area.intro.statement)}`),
    )
    lines.push('')
    // Sub-servicios con su descripción.
    for (const service of area.services) {
      lines.push(`- **${service.name}** — ${stripHtml(service.description)}`)
    }
    lines.push('')
  }

  // ── Páginas principales ───────────────────────────────────────────────────
  lines.push('## Páginas')
  lines.push('')
  for (const routeId of ['/identidad', '/miradas', '/contacto'] as const) {
    const copy = PAGE_COPY[routeId][locale]
    lines.push(link(copy.title, localizedUrl(routeId, locale), copy.description))
  }
  lines.push('')

  // ── Miradas (artículos), agrupadas por categoría madre ────────────────────
  const articles = getAllMiradas()
  const byParent = new Map<MiradasParentCategory, typeof articles>()
  for (const article of articles) {
    const parent = article.parentCategory
    if (!byParent.has(parent)) byParent.set(parent, [])
    byParent.get(parent)!.push(article)
  }

  lines.push('## Miradas')
  lines.push('')
  lines.push(
    oneLine(
      `Artículos sobre diseño, estrategia e IA (${articles.length} en total). ` +
        `Agrupados por área.`,
    ),
  )
  lines.push('')

  for (const parent of MIRADAS_PARENT_CATEGORIES) {
    const group = byParent.get(parent)
    if (!group || group.length === 0) continue
    lines.push(`### ${PARENT_DISPLAY[locale][parent]}`)
    lines.push('')
    for (const article of group) {
      const url = localizedUrl('/miradas/[parentOrSub]/[slug]', locale, {
        params: {
          parentOrSub: localizeSubSlug(
            article.category as MiradasSubcategory,
            locale,
          ),
          slug: article.slugByLocale[locale],
        },
      })
      lines.push(link(article.title, url, article.description))
    }
    lines.push('')
  }

  // ── Recursos ──────────────────────────────────────────────────────────────
  lines.push('## Recursos')
  lines.push('')
  lines.push(link('Sitemap XML', `${SITE_CONFIG.baseUrl}/sitemap.xml`))
  lines.push(link('Contacto', `mailto:${SITE_CONFIG.email}`))
  lines.push('')

  return lines.join('\n')
}

export function GET(): Response {
  return new Response(buildBody(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, must-revalidate',
    },
  })
}
