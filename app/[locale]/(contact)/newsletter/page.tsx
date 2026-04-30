import type { Metadata } from 'next'

import { ContactHero } from '@/components/contact/ContactHero'
import { ContactForm } from '@/components/contact/ContactForm'

import { buildPageMetadata } from '@/lib/seo/metadata.config'
import { getAlternates, localizedPath } from '@/lib/i18n/navigation'
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
    pathname: localizedPath('/newsletter', locale),
    alternates: getAlternates('/newsletter'),
  })
}

export default async function NewsletterPage({ params }: PageProps) {
  await params
  return (
    <ContactHero variant="newsletter">
      <ContactForm variant="newsletter" />
    </ContactHero>
  )
}
