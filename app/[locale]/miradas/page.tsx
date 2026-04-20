import type { Metadata } from 'next'

import { buildPageMetadata } from '@/lib/seo/metadata.config'
import { getAlternates, localizedPath } from '@/lib/i18n/routing'
import { type Locale } from '@/lib/i18n/config'
import { getAllMiradas } from '@/lib/content/miradas'
import { MiradasHero } from '@/components/miradas/MiradasHero'
import { MiradasGrid } from '@/components/miradas/MiradasGrid'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    routeId: '/miradas',
    title: 'Miradas',
    description: 'Reflexiones sobre diseño, estrategia, investigación e inteligencia artificial.',
    pathname: localizedPath('/miradas', locale),
    alternates: getAlternates('/miradas'),
  })
}

export default async function MiradasPage({ params }: PageProps) {
  await params
  const articles = getAllMiradas()

  return (
    <>
      <MiradasHero />
      <MiradasGrid articles={articles} />
    </>
  )
}
