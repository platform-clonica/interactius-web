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
  // Newsletter reutiliza el copy SEO de contacto como baseline.
  // Se puede añadir entrada propia en PAGE_COPY cuando se quiera customizar.
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
  await params

  return (
    <ContactHero
      title="Suscríbete a nuestra newsletter"
      copy="A menudo, el problema no es la falta de respuestas, sino no saber qué preguntas merece la pena hacerse. Cada mes enviamos nuestra newsletter con aprendizajes que unen la reflexión con la acción, sin ruido y con intención."
    >
      <ContactForm variant="newsletter" />
    </ContactHero>
  )
}
