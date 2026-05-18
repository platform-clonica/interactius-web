import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { buildPageMetadata, SITE_CONFIG } from '@/lib/seo/metadata.config'
import { localizedPath } from '@/lib/i18n/navigation'
import { type Locale, LOCALES } from '@/lib/i18n/config'
import { getAllMiradas } from '@/lib/content/miradas'
import {
  parseParentOrSubSlug,
  parseParentOrSubSlugAnyLocale,
  PARENT_DISPLAY,
  SUB_DISPLAY,
  PARENT_SLUG_BY_LOCALE,
  SUB_SLUG_BY_LOCALE,
  localizeSubSlug,
  localizeParentSlug,
} from '@/lib/miradas/i18n-routing'
import { SUB_TO_PARENT } from '@/lib/miradas/frontmatter.schema'
import { MiradasParentListing } from '@/components/miradas/MiradasParentListing'
import { MiradasSubListing } from '@/components/miradas/MiradasSubListing'

interface PageProps {
  params: Promise<{ locale: Locale; parentOrSub: string }>
}

export async function generateStaticParams() {
  const slugs = new Set<string>()
  for (const locale of LOCALES) {
    for (const slug of Object.values(PARENT_SLUG_BY_LOCALE[locale])) slugs.add(slug)
    for (const slug of Object.values(SUB_SLUG_BY_LOCALE[locale])) slugs.add(slug)
  }
  return [...slugs].map((parentOrSub) => ({ parentOrSub }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, parentOrSub } = await params
  const parsed = parseParentOrSubSlug(parentOrSub, locale)
  if (!parsed) return {}

  const t = await getTranslations({ locale, namespace: 'miradas' })

  const title =
    parsed.kind === 'parent'
      ? PARENT_DISPLAY[locale][parsed.canonical]
      : SUB_DISPLAY[locale][parsed.canonical]

  const alternates: Record<string, string> = {}
  for (const loc of LOCALES) {
    const localized =
      parsed.kind === 'parent'
        ? localizeParentSlug(parsed.canonical, loc)
        : localizeSubSlug(parsed.canonical, loc)
    alternates[loc] = `${SITE_CONFIG.baseUrl}${localizedPath(
      '/miradas/[parentOrSub]',
      loc,
      { params: { parentOrSub: localized } },
    )}`
  }
  alternates['x-default'] = alternates.es

  return buildPageMetadata({
    locale,
    routeId: '/miradas/[parentOrSub]',
    title,
    description: t('listing.intro', { topic: title.toLowerCase() }),
    pathname: localizedPath('/miradas/[parentOrSub]', locale, {
      params: { parentOrSub },
    }),
    alternates,
  })
}

export default async function ParentOrSubPage({ params }: PageProps) {
  const { locale, parentOrSub } = await params
  const parsed = parseParentOrSubSlug(parentOrSub, locale)
  if (!parsed) {
    // Auto-cura URLs cruzadas locale × slug (cache antiguo de Google o
    // sitemaps históricos mal generados): si el segmento es válido en
    // OTRA locale, redirigimos al canónico de la locale actual con 308.
    const crossLocale = parseParentOrSubSlugAnyLocale(parentOrSub)
    if (crossLocale && crossLocale.foundInLocale !== locale) {
      const canonical =
        crossLocale.kind === 'parent'
          ? localizeParentSlug(crossLocale.canonical, locale)
          : localizeSubSlug(crossLocale.canonical, locale)
      permanentRedirect(
        localizedPath('/miradas/[parentOrSub]', locale, {
          params: { parentOrSub: canonical },
        }),
      )
    }
    notFound()
  }

  const all = getAllMiradas()

  if (parsed.kind === 'parent') {
    const parent = parsed.canonical
    const articles = all.filter((a) => SUB_TO_PARENT[a.category] === parent)

    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: PARENT_DISPLAY[locale][parent],
      url: `${SITE_CONFIG.baseUrl}${localizedPath('/miradas/[parentOrSub]', locale, {
        params: { parentOrSub },
      })}`,
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
        />
        <MiradasParentListing parent={parent} articles={articles} locale={locale} />
      </>
    )
  }

  const sub = parsed.canonical
  const parent = SUB_TO_PARENT[sub]
  const articles = all.filter((a) => a.category === sub)

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: SUB_DISPLAY[locale][sub],
    isPartOf: {
      '@type': 'CollectionPage',
      name: PARENT_DISPLAY[locale][parent],
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <MiradasSubListing sub={sub} articles={articles} locale={locale} />
    </>
  )
}
