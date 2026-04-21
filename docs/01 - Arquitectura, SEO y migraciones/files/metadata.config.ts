// lib/metadata.config.ts
// Sistema centralizado de metadatos para Interactius
// Next.js App Router — Metadata API

import type { Metadata } from 'next'

// ─── Configuración base del sitio ────────────────────────────────────────────

export const SITE_CONFIG = {
  name:        'Interactius',
  url:         'https://www.interactius.com',
  description: 'Diseño estratégico, activación de soluciones y transformación cultural para organizaciones que quieren crecer con criterio.',
  locale: {
    es: 'es_ES',
    ca: 'ca_ES',
    en: 'en_GB',
  },
  // ⚠ PENDIENTE: reemplazar con URL definitiva cuando llegue el logo
  ogImage: 'https://www.interactius.com/og-default.jpg',
  social: {
    linkedin: 'https://www.linkedin.com/company/interactius',
  },
} as const

// ─── Metadatos base globales (heredados por todas las páginas) ────────────────

export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default:  SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  authors: [{ name: SITE_CONFIG.name, url: SITE_CONFIG.url }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  robots: {
    index:          true,
    follow:         true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
  openGraph: {
    type:        'website',
    siteName:    SITE_CONFIG.name,
    locale:      SITE_CONFIG.locale.es,
    images: [
      {
        url:    SITE_CONFIG.ogImage,
        width:  1200,
        height: 630,
        alt:    SITE_CONFIG.name,
      },
    ],
  },
  twitter: {
    card:    'summary_large_image',
    site:    '@interactius',
    creator: '@interactius',
  },
  icons: {
    // ⚠ PENDIENTE: añadir cuando lleguen los assets de marca
    icon:    '/favicon.ico',
    apple:   '/apple-touch-icon.png',
    shortcut: '/favicon-16x16.png',
  },
  verification: {
    // ⚠ PENDIENTE: añadir código de verificación de Search Console
    google: 'PENDIENTE_GSC_VERIFICATION_CODE',
  },
}

// ─── Patrones de metadatos por tipo de página ─────────────────────────────────
// Usar como base en cada page.tsx, sobrescribiendo title y description

export const pageMetadata = {

  home: {
    title:       'Diseño estratégico y activación de soluciones',
    description: 'Interactius ayuda a organizaciones a crecer con criterio mediante diseño estratégico, activación de soluciones y transformación cultural.',
    // ⚠ PENDIENTE: revisar con copy definitivo
  },

  pensamiento: {
    title:       'Pensamiento estratégico',
    description: 'Diseño estratégico, prospectiva y estrategias de innovación para organizaciones que necesitan claridad antes de actuar.',
    // ⚠ PENDIENTE: revisar con copy definitivo
  },

  activacion: {
    title:       'Activación de soluciones',
    description: 'Diseño de productos digitales, validación, investigación con usuarios sintéticos y reclutamiento para convertir ideas en soluciones reales.',
    // ⚠ PENDIENTE: revisar con copy definitivo
  },

  transformacion: {
    title:       'Transformación cultural',
    description: 'Cultura organizacional, organizaciones aumentadas con IA y bootcamps para equipos que quieren cambiar desde dentro.',
    // ⚠ PENDIENTE: revisar con copy definitivo
  },

  identidad: {
    title:       'Quiénes somos',
    description: 'Conoce la filosofía, valores y equipo de Interactius.',
    // ⚠ PENDIENTE: revisar con copy definitivo
  },

  contacto: {
    title:       'Contacto',
    description: 'Habla con Interactius. Cuéntanos tu reto.',
    robots: { index: true, follow: true },
  },

  miradas: {
    title:       'Miradas',
    description: 'Artículos, reflexiones y conversaciones sobre diseño estratégico, investigación y transformación organizacional.',
  },

  legal: {
    title:       'Aviso legal',
    description: 'Aviso legal y política de privacidad de Interactius.',
    robots: { index: false, follow: false },
  },

} as const

// ─── Helper para artículos de Miradas ────────────────────────────────────────

export interface ArticleMetaInput {
  title:       string
  description: string
  slug:        string
  category:    string
  publishedAt: string
  author?:     string
  image?:      string
  locale?:     'es' | 'ca' | 'en'
}

export function buildArticleMetadata(article: ArticleMetaInput): Metadata {
  const locale = article.locale ?? 'es'
  const url    = `/${locale === 'es' ? '' : locale + '/'}miradas/${article.category}/${article.slug}`
  const image  = article.image ?? SITE_CONFIG.ogImage

  return {
    title:       article.title,
    description: article.description,
    alternates: {
      canonical: `${SITE_CONFIG.url}${url}`,
    },
    openGraph: {
      type:            'article',
      title:           article.title,
      description:     article.description,
      url:             `${SITE_CONFIG.url}${url}`,
      siteName:        SITE_CONFIG.name,
      locale:          SITE_CONFIG.locale[locale],
      publishedTime:   article.publishedAt,
      authors:         article.author ? [article.author] : [SITE_CONFIG.name],
      images: [{ url: image, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card:        'summary_large_image',
      title:       article.title,
      description: article.description,
      images:      [image],
    },
  }
}

// ─── Helper para páginas de capacidad ────────────────────────────────────────

export function buildPageMetadata(
  key: keyof typeof pageMetadata,
  canonical: string,
  locale: 'es' | 'ca' | 'en' = 'es',
  overrides?: Partial<Metadata>
): Metadata {
  const base = pageMetadata[key]
  return {
    ...base,
    alternates: {
      canonical: `${SITE_CONFIG.url}${canonical}`,
      languages: {
        'es':      `${SITE_CONFIG.url}${canonical}`,
        'ca':      `${SITE_CONFIG.url}/ca${canonical}`,
        'en':      `${SITE_CONFIG.url}/en${canonical}`,
        'x-default': `${SITE_CONFIG.url}${canonical}`,
      },
    },
    openGraph: {
      ...base,
      type:     'website',
      url:      `${SITE_CONFIG.url}${canonical}`,
      locale:   SITE_CONFIG.locale[locale],
      siteName: SITE_CONFIG.name,
      images:   [{ url: SITE_CONFIG.ogImage, width: 1200, height: 630, alt: SITE_CONFIG.name }],
    },
    ...overrides,
  }
}
