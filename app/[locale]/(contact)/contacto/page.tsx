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
    pathname: localizedPath('/contacto', locale),
    alternates: getAlternates('/contacto'),
  })
}

export default async function ContactoPage({ params }: PageProps) {
  await params
  return (
    <ContactHero variant="contacto">
      <ContactForm variant="contacto" />
    </ContactHero>
  )
}
