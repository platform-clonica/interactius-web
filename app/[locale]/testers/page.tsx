import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ContactHero } from '@/components/contact/ContactHero'
import { ContactForm } from '@/components/contact/ContactForm'

import { buildPageMetadata } from '@/lib/seo/metadata.config'
import { getAlternates, localizedPath } from '@/lib/i18n/routing'
import { type Locale } from '@/lib/i18n/config'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    routeId: '/contacto',
    title: 'Testers',
    description:
      'Participa en nuestras dinámicas de investigación. Tu voz ayuda a mejorar productos y servicios reales.',
    pathname: localizedPath('/contacto', locale).replace(
      /contacto$|contacte$|contact$/,
      'testers',
    ),
    alternates: getAlternates('/contacto'),
  })
}

export default async function TestersPage({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contacto' })

  return (
    <ContactHero
      title={t('testers.title')}
      copy={t('testers.copy')}
    >
      <ContactForm variant="testers" />
    </ContactHero>
  )
}
