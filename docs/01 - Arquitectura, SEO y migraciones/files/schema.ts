// lib/schema.ts
// Schema.org estructurado para Interactius
// Implementar en el RootLayout y en páginas específicas

// ─── Organization (home y global) ────────────────────────────────────────────

export const organizationSchema = {
  '@context':  'https://schema.org',
  '@type':     'Organization',
  name:        'Interactius',
  url:         'https://www.interactius.com',
  // ⚠ PENDIENTE: reemplazar con URL definitiva del logo
  logo:        'https://www.interactius.com/logo.svg',
  description: 'Diseño estratégico, activación de soluciones y transformación cultural para organizaciones.',
  address: {
    '@type':           'PostalAddress',
    streetAddress:     'Pau Claris 100, 2a Planta',
    addressLocality:   'Barcelona',
    postalCode:        '08009',
    addressCountry:    'ES',
  },
  sameAs: [
    'https://www.linkedin.com/company/interactius',
  ],
  contactPoint: {
    '@type':       'ContactPoint',
    contactType:   'customer service',
    url:           'https://www.interactius.com/contacto',
    availableLanguage: ['Spanish', 'Catalan', 'English'],
  },
}

// ─── WebSite (para sitelinks searchbox si aplica en el futuro) ────────────────

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type':    'WebSite',
  name:       'Interactius',
  url:        'https://www.interactius.com',
}

// ─── BreadcrumbList (para páginas internas) ───────────────────────────────────

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context':        'https://schema.org',
    '@type':           'BreadcrumbList',
    itemListElement:   items.map((item, index) => ({
      '@type':    'ListItem',
      position:   index + 1,
      name:       item.name,
      item:       item.url,
    })),
  }
}

// ─── Article (para artículos de Miradas) ─────────────────────────────────────

export interface ArticleSchemaInput {
  title:       string
  description: string
  slug:        string
  category:    string
  publishedAt: string
  modifiedAt?: string
  author?:     string
  image?:      string
}

export function buildArticleSchema(article: ArticleSchemaInput) {
  const url = `https://www.interactius.com/miradas/${article.category}/${article.slug}`
  return {
    '@context':         'https://schema.org',
    '@type':            'Article',
    headline:           article.title,
    description:        article.description,
    url,
    datePublished:      article.publishedAt,
    dateModified:       article.modifiedAt ?? article.publishedAt,
    author: {
      '@type': 'Person',
      name:    article.author ?? 'Interactius',
    },
    publisher: {
      '@type': 'Organization',
      name:    'Interactius',
      url:     'https://www.interactius.com',
      // ⚠ PENDIENTE: logo definitivo
      logo: {
        '@type': 'ImageObject',
        url:     'https://www.interactius.com/logo.svg',
      },
    },
    image: article.image
      ? { '@type': 'ImageObject', url: article.image }
      : undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id':   url,
    },
  }
}

// ─── Helper para inyectar schemas en el <head> ────────────────────────────────
// Uso: <SchemaScript schema={organizationSchema} />

export function schemaToScript(schema: object): string {
  return JSON.stringify(schema)
}
