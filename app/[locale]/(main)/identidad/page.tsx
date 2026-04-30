import type { Metadata } from 'next'

import { buildPageMetadata } from '@/lib/seo/metadata.config'
import { getAlternates, localizedPath } from '@/lib/i18n/navigation'
import { type Locale } from '@/lib/i18n/config'
import { IdentidadHero } from '@/components/identidad/IdentidadHero'
import { IdentidadIntro } from '@/components/identidad/IdentidadIntro'
import { IdentidadValores } from '@/components/identidad/IdentidadValores'
import { IdentidadLiminal } from '@/components/identidad/IdentidadLiminal'
import { IdentidadMetodologia } from '@/components/identidad/IdentidadMetodologia'
import { IdentidadGente } from '@/components/identidad/IdentidadGente'
import { IdentidadJoinUs } from '@/components/identidad/IdentidadJoinUs'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    routeId: '/identidad',
    pathname: localizedPath('/identidad', locale),
    alternates: getAlternates('/identidad'),
  })
}

export default async function Identidad({ params }: PageProps) {
  await params

  return (
    <>
      <IdentidadHero />
      <IdentidadIntro />
      <IdentidadValores />
      <IdentidadLiminal />
      <IdentidadMetodologia />
      <IdentidadGente />
      <IdentidadJoinUs />
    </>
  )
}
