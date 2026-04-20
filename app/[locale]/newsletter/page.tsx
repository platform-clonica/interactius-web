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
    title: 'Newsletter',
    description:
      'Cada mes enviamos aprendizajes sobre diseño, estrategia e IA. Suscríbete.',
    pathname: localizedPath('/contacto', locale).replace(
      /contacto$|contacte$|contact$/,
      'newsletter',
    ),
    alternates: getAlternates('/contacto'),
  })
}

export default async function NewsletterPage({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contacto' })

  return (
    <ContactHero
      title={t('newsletter.title')}
      copy={t('newsletter.copy')}
    >
      <ContactForm variant="newsletter" />
    </ContactHero>
  )
}
