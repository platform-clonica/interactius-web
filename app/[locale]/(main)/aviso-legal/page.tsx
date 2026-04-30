import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

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
    routeId: '/aviso-legal',
    title: 'Aviso legal',
    pathname: localizedPath('/aviso-legal', locale),
    alternates: getAlternates('/aviso-legal'),
  })
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contacto' })

  return (
    <section className="section-inner py-section">
      <h1 className="font-serif text-title font-light text-fg">
        {t('avisoLegal.title')}
      </h1>
      <p className="mt-8 font-mono text-body-sm text-fg/70">
        {t('avisoLegal.stub')}
      </p>
    </section>
  )
}
