import type { Metadata } from 'next'

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
    routeId: '/identidad',
    title: 'Identidad',
    pathname: localizedPath('/identidad', locale),
    alternates: getAlternates('/identidad'),
  })
}

export default async function Page() {
  return (
    <section className="section-inner py-section">
      <h1 className="font-serif text-title font-light text-fg">
        Identidad
      </h1>
      <p className="mt-8 font-mono text-body-sm text-fg/70">
        Página en construcción.
      </p>
    </section>
  )
}
