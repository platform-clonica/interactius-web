/**
 * Stub temporal — página pendiente de implementación en Sprint posterior.
 * Permite que la navegación global funcione sin 404.
 * Se reemplaza por la implementación real en su Sprint correspondiente.
 */

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
    routeId: '/pensamiento-estrategico',
    pathname: localizedPath('/pensamiento-estrategico', locale),
    alternates: getAlternates('/pensamiento-estrategico'),
  })
}

export default async function Page() {
  return (
    <section className="section-inner py-section">
      <h1 className="font-serif text-title font-light text-fg">
        Pensamiento estratégico
      </h1>
      <p className="mt-8 font-mono text-body-sm text-fg/70">
        Página en construcción — Sprint 4.
      </p>
    </section>
  )
}
