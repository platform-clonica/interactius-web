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
  await params

  return (
    <ContactHero
      title="Tu voz importa y queremos escucharla"
      copy="Un espacio para personas que quieren participar y aportar su experiencia en la mejora de productos y servicios. No buscamos perfiles ideales. Buscamos realidades. Aquí tu voz se convierte en parte del proceso: entrevistas, tests y dinámicas donde lo importante no es opinar, sino ayudar a entender mejor lo que está pasando. Porque las mejores decisiones no se toman sin escuchar a las personas."
    >
      <ContactForm variant="testers" />
    </ContactHero>
  )
}
