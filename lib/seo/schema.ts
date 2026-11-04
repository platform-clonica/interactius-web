import { LOCALE_META, type Locale } from '@/lib/i18n/config'
import { resolveAuthor } from '@/lib/data/author'
import { SITE_CONFIG } from '@/lib/seo/metadata.config'

/* ==========================================================================
   Tipos base — JSON-LD / schema.org
   --------------------------------------------------------------------------
   No intentamos cubrir todo schema.org. Solo los tipos que realmente usamos.
   Los objetos se serializan con JSON.stringify() y se inyectan dentro de
   <script type="application/ld+json">.
   ========================================================================== */

type JsonValue = string | number | boolean | JsonObject | JsonValue[] | null

interface JsonObject {
  [key: string]: JsonValue | undefined
}

interface SchemaBase extends JsonObject {
  '@context': 'https://schema.org'
  '@type': string
}

/* ==========================================================================
   Identificadores estables — permiten cross-referenciar schemas
   ========================================================================== */

const ORG_ID = `${SITE_CONFIG.baseUrl}/#organization`
const WEBSITE_ID = `${SITE_CONFIG.baseUrl}/#website`

/* ==========================================================================
   buildOrganizationSchema(locale)
   ========================================================================== */

export function buildOrganizationSchema(locale: Locale): SchemaBase {
  const logoUrl = `${SITE_CONFIG.baseUrl}${SITE_CONFIG.ogImage.url}`

  return cleanObject({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl,
      width: SITE_CONFIG.ogImage.width,
      height: SITE_CONFIG.ogImage.height,
    },
    description: SITE_CONFIG.tagline,
    foundingDate: '2012',
    inLanguage: LOCALE_META[locale].htmlLang,
    knowsLanguage: Object.values(LOCALE_META).map((m) => m.htmlLang),
    areaServed: {
      '@type': 'Place',
      name: 'Europe',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.address.street,
      postalCode: SITE_CONFIG.address.postalCode,
      addressLocality: SITE_CONFIG.address.city,
      addressRegion: SITE_CONFIG.address.region,
      addressCountry: SITE_CONFIG.address.country,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: SITE_CONFIG.email,
        telephone: SITE_CONFIG.phone,
        availableLanguage: Object.values(LOCALE_META).map((m) => m.displayName),
      },
    ],
    sameAs: [SITE_CONFIG.social.linkedin, SITE_CONFIG.social.instagram, SITE_CONFIG.social.youtube],
  }) as SchemaBase
}

/* ==========================================================================
   buildWebSiteSchema(locale)
   ========================================================================== */

export function buildWebSiteSchema(locale: Locale): SchemaBase {
  return cleanObject({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.baseUrl,
    description: SITE_CONFIG.tagline,
    inLanguage: LOCALE_META[locale].htmlLang,
    publisher: { '@id': ORG_ID },

    // potentialAction SearchAction — descomentar cuando exista un buscador
    // interno real en el sitio. Declararlo sin implementación puede
    // perjudicar los rich results.
    //
    // potentialAction: {
    //   '@type': 'SearchAction',
    //   target: {
    //     '@type': 'EntryPoint',
    //     urlTemplate: `${SITE_CONFIG.baseUrl}/buscar?q={search_term_string}`,
    //   },
    //   'query-input': 'required name=search_term_string',
    // },
  }) as SchemaBase
}

/* ==========================================================================
   buildBreadcrumbSchema(items)
   ========================================================================== */

interface BreadcrumbItem {
  name: string
  /** Puede ser URL relativa (se resuelve a absoluta) o absoluta. */
  url: string
}

/**
 * Construye un BreadcrumbList schema.
 * Ejemplo:
 *   buildBreadcrumbSchema([
 *     { name: 'Inicio', url: '/' },
 *     { name: 'Miradas', url: '/miradas' },
 *     { name: 'Diseño', url: '/miradas/design' },
 *     { name: 'Título del artículo', url: '/miradas/design/slug' },
 *   ])
 */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]): SchemaBase {
  return cleanObject({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: resolveUrl(item.url),
    })),
  }) as SchemaBase
}

/* ==========================================================================
   buildArticleSchema(article, locale)
   ========================================================================== */

interface ArticleInput {
  /** Título del artículo. */
  headline: string
  /** Descripción corta (meta description del artículo). */
  description: string
  /** URL absoluta de la imagen destacada. */
  image: string
  /** ISO 8601. Ej. '2025-01-15'. */
  datePublished: string
  /** ISO 8601. Opcional. */
  dateModified?: string
  /** Autor: si es string, se tipa como Person. Si no, cae al publisher. */
  author?: string
  /** Categoría del artículo (design, ux, research, etc.) */
  section?: string
  /** Tags del frontmatter. */
  keywords?: string[]
  /** URL canónica del artículo (con protocolo + dominio). */
  url: string
}

export function buildArticleSchema(article: ArticleInput, locale: Locale): SchemaBase {
  const imageUrl = resolveUrl(article.image)

  return cleanObject({
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    headline: article.headline,
    description: article.description,
    image: imageUrl,
    datePublished: article.datePublished,
    dateModified: article.dateModified ?? article.datePublished,
    inLanguage: LOCALE_META[locale].htmlLang,
    articleSection: article.section,
    keywords: article.keywords?.join(', '),
    /* El autor se resuelve contra el registro de equipo para declarar su
       nombre completo y su cargo. `jobTitle` es lo que convierte "un texto
       firmado por Sara" en "un texto firmado por una Design Strategist": para
       un buscador de respuestas, esa es la señal de autoría. Quien ya no está
       en el equipo conserva su nombre, sin cargo. */
    author: article.author
      ? {
          '@type': 'Person',
          name: resolveAuthor(article.author).name,
          jobTitle: resolveAuthor(article.author).role,
        }
      : { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
  }) as SchemaBase
}

/* ==========================================================================
   Helpers internos
   ========================================================================== */

/**
 * Convierte URL relativa en absoluta. Si ya es absoluta, la devuelve igual.
 */
function resolveUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${SITE_CONFIG.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

/* ==========================================================================
   buildCapabilitySchema(input)
   --------------------------------------------------------------------------
   Las tres páginas de capacidad no declaraban nada propio: solo llevaban el
   `Organization` + `WebSite` que el layout pone a todas. Es decir, las páginas
   que existen para vender no le decían a Google ni a un buscador de
   respuestas qué servicios ofrecemos. Los artículos del blog sí lo hacían.

   Se modela como `Service` con `hasOfferCatalog`, que es el patrón estándar
   para "una capacidad que agrupa varios servicios concretos". Cada servicio
   del catálogo sale del mismo JSON que pinta la página, así que no hay una
   segunda lista que mantener: si alguien edita un servicio, el dato
   estructurado cambia con él.

   `provider` apunta al `@id` de la Organization en vez de repetir sus datos.
   Esa organización ya está declarada en el layout de todas las páginas, así
   que el buscador une las dos piezas en una sola entidad.
   ========================================================================== */

interface CapabilityServiceInput {
  name: string
  /** Puede traer <strong> del JSON de la página; se limpia aquí. */
  description?: string
}

interface CapabilityInput {
  /** Nombre de la capacidad. Ej. 'Pensamiento estratégico'. */
  name: string
  /** Descripción corta de la capacidad (la meta description de la página). */
  description: string
  /** Ruta localizada de la página, con o sin dominio. */
  url: string
  services: CapabilityServiceInput[]
}

/** Quita etiquetas HTML y normaliza espacios. Las descripciones del JSON de
    capacidades llevan <strong> para el render, que en JSON-LD sobra. */
function stripTags(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildCapabilitySchema(input: CapabilityInput): SchemaBase {
  const url = resolveUrl(input.url)

  return cleanObject({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: input.name,
    serviceType: input.name,
    description: input.description,
    url,
    provider: { '@id': ORG_ID },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: input.name,
      itemListElement: input.services.map((service) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service.name,
          description: service.description ? stripTags(service.description) : undefined,
        },
      })),
    },
  }) as SchemaBase
}

/**
 * Elimina recursivamente claves con valor undefined/null/'' y arrays vacíos.
 * Los schemas JSON-LD deben tener solo campos con valor. Google lee null
 * como "campo inválido" en algunos casos — mejor omitir.
 */
function cleanObject(input: JsonObject): JsonObject {
  const out: JsonObject = {}
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === '') continue

    if (Array.isArray(value)) {
      const cleaned = value
        .map((item) =>
          typeof item === 'object' && item !== null && !Array.isArray(item)
            ? cleanObject(item as JsonObject)
            : item,
        )
        .filter((item) => {
          if (item === undefined || item === null || item === '') return false
          if (typeof item === 'object' && !Array.isArray(item)) {
            return Object.keys(item).length > 0
          }
          return true
        })
      if (cleaned.length > 0) out[key] = cleaned as JsonValue[]
      continue
    }

    if (typeof value === 'object') {
      const cleaned = cleanObject(value as JsonObject)
      if (Object.keys(cleaned).length > 0) out[key] = cleaned
      continue
    }

    out[key] = value
  }
  return out
}
