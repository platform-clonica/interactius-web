import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { LegalContent } from '@/components/legal/LegalContent'
import { buildPageMetadata } from '@/lib/seo/metadata.config'
import { getAlternates, localizedPath } from '@/lib/i18n/navigation'
import { type Locale } from '@/lib/i18n/config'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal' })
  return buildPageMetadata({
    locale,
    routeId: '/aviso-legal',
    title: t('avisoLegal.title'),
    pathname: localizedPath('/aviso-legal', locale),
    alternates: getAlternates('/aviso-legal'),
  })
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal' })

  type Block = Parameters<typeof LegalContent>[0]
  const data = t.raw('avisoLegal') as Block

  return <LegalContent {...data} />
}
