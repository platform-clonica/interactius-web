import type { Metadata } from 'next'

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
    pathname: localizedPath('/contacto', locale),
    alternates: getAlternates('/contacto'),
  })
}

export default async function ContactoPage({ params }: PageProps) {
  await params

  return (
    <ContactHero
      title="Antes de escribirnos… No somos para todo el mundo."
      copy="Trabajamos con organizaciones dispuestas a cuestionar lo que dan por sentado. Que buscan decisiones con criterio y no solo velocidad. Que entienden que el brief rara vez contiene la pregunta correcta. Si buscas ejecución rápida, hay otras opciones. Si lo que necesitas es pensar desde el margen, escríbenos."
      altEmail="info@interactius.com"
    >
      <ContactForm variant="contacto" />
    </ContactHero>
  )
}
