import type { Metadata } from 'next'

import { buildPageMetadata, SITE_CONFIG } from '@/lib/seo/metadata.config'
import { getAlternates, localizedPath } from '@/lib/i18n/navigation'
import { type Locale } from '@/lib/i18n/config'
import { getAllMiradas } from '@/lib/content/miradas'
import { MiradasGlobalHome } from '@/components/miradas/MiradasGlobalHome'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    routeId: '/miradas',
    pathname: localizedPath('/miradas', locale),
    alternates: getAlternates('/miradas'),
  })
}

export default async function MiradasPage({ params }: PageProps) {
  const { locale } = await params
  const articles = getAllMiradas()

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Miradas',
    url: `${SITE_CONFIG.baseUrl}${localizedPath('/miradas', locale)}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <MiradasGlobalHome articles={articles} locale={locale} />
    </>
  )
}
