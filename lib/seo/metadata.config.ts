import type { Metadata } from 'next'

import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_META,
  type Locale,
} from '@/lib/i18n/config'

/* ==========================================================================
   SITE_CONFIG — constantes de marca y entorno
   --------------------------------------------------------------------------
   Single source of truth para cualquier cosa que tenga que ver con la
   identidad del site a nivel de metadatos.
   ========================================================================== */

/**
 * Base URL del sitio. Prioridad:
 * 1. NEXT_PUBLIC_SITE_URL — se pasa por variable de entorno (prod/staging/preview).
 * 2. Fallback producción: https://www.interactius.com
 *
 * Importante: sin trailing slash. Los helpers de routing concatenan paths
 * con barra inicial.
 */
const RESOLVED_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://www.interactius.com'

/**
 * Detección de entornos que no deben indexarse (staging/preview/local).
 * Cualquier URL que no sea el dominio canónico se trata como no indexable.
 */
const IS_PRODUCTION_HOST =
  RESOLVED_BASE_URL === 'https://www.interactius.com' ||
  RESOLVED_BASE_URL === 'https://interactius.com'

export const SITE_CONFIG = {
  name: 'Interactius',
  /** Tagline breve usada como description fallback y en OG. */
  tagline: 'Diseño estratégico, criterio y tecnología aplicada.',
  /** Dominio sin protocolo — útil para metadata.metadataBase legacy. */
  domain: 'www.interactius.com',
  /** URL base canónica con protocolo y sin trailing slash. */
  baseUrl: RESOLVED_BASE_URL,
  /** Si estamos en el host de producción (determina robots policy). */
  isProduction: IS_PRODUCTION_HOST,

  /** Contacto canónico — también usado en JSON-LD Organization. */
  email: 'hola@interactius.com',
  phone: '+34 936 24 39 13',
  address: {
    street: 'Pau Claris 100, Planta 2',
    postalCode: '08009',
    city: 'Barcelona',
    region: 'Catalonia',
    country: 'ES',
    countryName: 'Spain',
  },

  /** URLs de redes sociales — consumidas por MenuOverlay, Footer y schema. */
  social: {
    linkedin: 'https://www.linkedin.com/company/interactius',
    instagram: 'https://www.instagram.com/interactius',
    youtube: 'https://www.youtube.com/@interactius',
  },

  /**
   * OG image por defecto — 1200×630.
   * Placeholder hasta que se cree el asset real o se genere con
   * app/opengraph-image.tsx en Sprint 6.
   */
  ogImage: {
    url: '/og-default.png',
    width: 1200,
    height: 630,
    alt: 'Interactius',
  },

  /** Iconos. Placeholders — assets reales llegan en Sprint 6 de lanzamiento. */
  icons: {
    favicon: '/favicon.ico',
    appleTouchIcon: '/apple-touch-icon.png',
    manifest: '/site.webmanifest',
  },

  /**
   * Google Search Console verification code. Leído de env.
   * Si está vacío, no se renderiza meta tag.
   * Para añadir: NEXT_PUBLIC_GSC_VERIFICATION=xxxxx en el deploy.
   */
  gscVerification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? '',
} as const

/* ==========================================================================
   Copy por página — titles y descriptions
   --------------------------------------------------------------------------
   ⚠ ES completo. CA y EN pendientes de traducción antes de lanzamiento.
   La voice sigue la guía de estilo (directa, sin jerga vacía, criterio).
   ========================================================================== */

type RouteCopy = {
  title: string
  description: string
}

type RouteCopyMap = Record<Locale, RouteCopy>

/**
 * Copy SEO por página canónica.
 * El título se inserta en el template "%s | Interactius" definido en root.
 * La home tiene template distinto (solo el siteName).
 */
export const PAGE_COPY: Record<string, RouteCopyMap> = {
  '/': {
    es: {
      title: 'Interactius', // sin template — home lleva solo siteName
      description:
        'Diseño estratégico, criterio humano y tecnología para ayudar a las organizaciones a tomar mejores decisiones.',
    },
    ca: {
      // TODO — translate before launch
      title: 'Interactius',
      description:
        'Disseny estratègic, criteri humà i tecnologia per ajudar les organitzacions a prendre millors decisions.',
    },
    en: {
      // TODO — translate before launch
      title: 'Interactius',
      description:
        'Strategic design, human judgement and technology helping organisations make better decisions.',
    },
  },

  '/pensamiento-estrategico': {
    es: {
      title: 'Pensamiento estratégico',
      description:
        'Diseño estratégico, prospectiva e innovación para orientar decisiones en contextos de incertidumbre.',
    },
    ca: {
      title: 'Pensament estratègic',
      description:
        'Disseny estratègic, prospectiva i innovació per orientar decisions en contextos d’incertesa.',
    },
    en: {
      title: 'Strategic thinking',
      description:
        'Strategic design, foresight and innovation for decision-making under uncertainty.',
    },
  },

  '/activacion-de-soluciones': {
    es: {
      title: 'Activación de soluciones',
      description:
        'Convertimos la estrategia en productos y servicios validados. Reducimos riesgo antes de escalar.',
    },
    ca: {
      title: 'Activació de solucions',
      description:
        'Convertim l’estratègia en productes i serveis validats. Reduïm el risc abans d’escalar.',
    },
    en: {
      title: 'Solution activation',
      description:
        'We turn strategy into validated products and services. Reduce risk before scaling.',
    },
  },

  '/transformacion-cultural': {
    es: {
      title: 'Transformación cultural',
      description:
        'Cultura organizacional, IA aplicada y programas de capacitación para equipos que deciden mejor.',
    },
    ca: {
      title: 'Transformació cultural',
      description:
        'Cultura organitzativa, IA aplicada i programes de capacitació per a equips que decideixen millor.',
    },
    en: {
      title: 'Cultural transformation',
      description:
        'Organisational culture, applied AI and training programmes for teams that decide better.',
    },
  },

  '/identidad': {
    es: {
      title: 'Identidad',
      description:
        'Quiénes somos, cómo pensamos y qué tipo de problemas nos interesan.',
    },
    ca: {
      title: 'Identitat',
      description:
        'Qui som, com pensem i quin tipus de problemes ens interessen.',
    },
    en: {
      title: 'Identity',
      description: 'Who we are, how we think and what kind of problems we take on.',
    },
  },

  '/contacto': {
    es: {
      title: 'Contacto',
      description:
        'Trabajamos con organizaciones dispuestas a cuestionar lo que dan por sentado. Escríbenos.',
    },
    ca: {
      title: 'Contacte',
      description:
        'Treballem amb organitzacions disposades a qüestionar el que donen per descomptat. Escriu-nos.',
    },
    en: {
      title: 'Contact',
      description:
        'We work with organisations willing to challenge their assumptions. Get in touch.',
    },
  },

  '/miradas': {
    es: {
      title: 'Miradas',
      description:
        'Aprendizajes sobre diseño, estrategia e IA. Sin ruido y con intención.',
    },
    ca: {
      title: 'Mirades',
      description:
        'Aprenentatges sobre disseny, estratègia i IA. Sense soroll i amb intenció.',
    },
    en: {
      title: 'Thoughts',
      description:
        'Observations on design, strategy and AI. No noise, with intention.',
    },
  },

  '/aviso-legal': {
    es: {
      title: 'Aviso legal',
      description: 'Información legal del sitio web de Interactius.',
    },
    ca: {
      title: 'Avís legal',
      description: 'Informació legal del lloc web d’Interactius.',
    },
    en: {
      title: 'Legal notice',
      description: 'Legal information for the Interactius website.',
    },
  },
}

/* ==========================================================================
   buildRootMetadata(locale) — metadata base del RootLayout
   ========================================================================== */

export function buildRootMetadata(locale: Locale): Metadata {
  const copy = PAGE_COPY['/'][locale]
  const localeMeta = LOCALE_META[locale]
  const alternateLocales = LOCALES.filter((l) => l !== locale).map(
    (l) => LOCALE_META[l].htmlLang,
  )

  return {
    metadataBase: new URL(SITE_CONFIG.baseUrl),

    title: {
      default: copy.title,
      template: `%s | ${SITE_CONFIG.name}`,
    },
    description: copy.description,
    applicationName: SITE_CONFIG.name,
    generator: 'Next.js',

    // Robots — en staging/preview bloqueamos indexación completa.
    robots: SITE_CONFIG.isProduction
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-snippet': -1,
            'max-image-preview': 'large',
            'max-video-preview': -1,
          },
        }
      : {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        },

    // Verification — solo se renderiza si hay código en env
    verification: SITE_CONFIG.gscVerification
      ? { google: SITE_CONFIG.gscVerification }
      : undefined,

    // Alternates root — cada locale apunta a su home.
    alternates: {
      canonical:
        locale === DEFAULT_LOCALE
          ? SITE_CONFIG.baseUrl
          : `${SITE_CONFIG.baseUrl}/${locale}`,
      languages: buildRootAlternates(),
    },

    // Open Graph defaults.
    openGraph: {
      type: 'website',
      locale: localeMeta.htmlLang.replace('-', '_'),
      alternateLocale: alternateLocales.map((l) => l.replace('-', '_')),
      url:
        locale === DEFAULT_LOCALE
          ? SITE_CONFIG.baseUrl
          : `${SITE_CONFIG.baseUrl}/${locale}`,
      siteName: SITE_CONFIG.name,
      title: copy.title,
      description: copy.description,
      images: [SITE_CONFIG.ogImage],
    },

    // Twitter Card.
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: [SITE_CONFIG.ogImage.url],
    },

    // Iconos — placeholders (Sprint 6 sustituye)
    icons: {
      icon: SITE_CONFIG.icons.favicon,
      apple: SITE_CONFIG.icons.appleTouchIcon,
    },
    manifest: SITE_CONFIG.icons.manifest,

    // Otros
    referrer: 'origin-when-cross-origin',
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },
  }
}

/* ==========================================================================
   buildPageMetadata({ locale, routeId, params?, type? })
   --------------------------------------------------------------------------
   Helper para `generateMetadata` en cada page.tsx. Recoge el copy del
   diccionario, construye canonical + alternates + OG específicos.
   ========================================================================== */

interface BuildPageMetadataArgs {
  locale: Locale
  /**
   * RouteId canónico (coincide con keys de PAGE_COPY y con el mapa de
   * routing.ts). Para páginas dinámicas (artículos Miradas) se pasa
   * '/miradas/[cat]/[slug]' y el params adicional.
   */
  routeId: keyof typeof PAGE_COPY | '/miradas/[cat]/[slug]'
  /**
   * Override de título. Requerido para páginas dinámicas, opcional para
   * estáticas (si se omite, se usa PAGE_COPY).
   */
  title?: string
  description?: string
  /** Override de OG image (1200×630 recomendado). */
  ogImage?: {
    url: string
    width: number
    height: number
    alt?: string
  }
  /** Tipo de contenido OG. 'article' para Miradas. */
  type?: 'website' | 'article'
  /**
   * Metadata específica de artículo (solo relevante con type='article').
   */
  article?: {
    publishedTime: string
    modifiedTime?: string
    author?: string
    section?: string
    tags?: string[]
  }
  /** Pathname absoluto para canonical/hreflang (ya localizado). */
  pathname: string
  /** Mapa de URLs alternativas por locale para hreflang. */
  alternates: Record<string, string>
}

export function buildPageMetadata({
  locale,
  routeId,
  title: titleOverride,
  description: descriptionOverride,
  ogImage,
  type = 'website',
  article,
  pathname,
  alternates,
}: BuildPageMetadataArgs): Metadata {
  const baseCopy =
    routeId in PAGE_COPY
      ? PAGE_COPY[routeId as keyof typeof PAGE_COPY][locale]
      : null

  const title = titleOverride ?? baseCopy?.title ?? SITE_CONFIG.name
  const description =
    descriptionOverride ?? baseCopy?.description ?? SITE_CONFIG.tagline

  const canonicalUrl = `${SITE_CONFIG.baseUrl}${pathname}`
  const localeMeta = LOCALE_META[locale]
  const alternateLocales = LOCALES.filter((l) => l !== locale).map((l) =>
    LOCALE_META[l].htmlLang.replace('-', '_'),
  )
  const image = ogImage ?? SITE_CONFIG.ogImage

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: alternates,
    },
    openGraph: {
      type,
      locale: localeMeta.htmlLang.replace('-', '_'),
      alternateLocale: alternateLocales,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      title,
      description,
      images: [image],
      ...(type === 'article' && article
        ? {
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime,
            authors: article.author ? [article.author] : undefined,
            section: article.section,
            tags: article.tags,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  }

  return metadata
}

/* ==========================================================================
   Helpers internos
   ========================================================================== */

/**
 * Construye el mapa `alternates.languages` para la home / root metadata.
 * - es: baseUrl (sin prefijo, por ser default locale).
 * - ca: baseUrl/ca
 * - en: baseUrl/en
 * - x-default: apunta al default locale (ES).
 */
function buildRootAlternates(): Record<string, string> {
  const out: Record<string, string> = {}

  for (const locale of LOCALES) {
    out[locale] =
      locale === DEFAULT_LOCALE
        ? SITE_CONFIG.baseUrl
        : `${SITE_CONFIG.baseUrl}/${locale}`
  }

  out['x-default'] = SITE_CONFIG.baseUrl
  return out
}
