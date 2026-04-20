import type { Metadata } from 'next'

import { HeroScroll } from '@/components/home/HeroScroll'
import { IntroScroll } from '@/components/home/IntroScroll'
import { ServicesRows } from '@/components/home/ServicesRows'
import { WorkGrid } from '@/components/home/WorkGrid'
import { ClientsMarquee } from '@/components/home/ClientsMarquee'

import { buildPageMetadata } from '@/lib/seo/metadata.config'
import { getAlternates, localizedPath } from '@/lib/i18n/routing'
import { type Locale } from '@/lib/i18n/config'

/* ==========================================================================
   Metadata
   ========================================================================== */

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params

  return buildPageMetadata({
    locale,
    routeId: '/',
    pathname: localizedPath('/', locale),
    alternates: getAlternates('/'),
  })
}

/* ==========================================================================
   Page
   --------------------------------------------------------------------------
   Orden DOM (crítico por el stacking context del scroll):
     1. HeroScroll    — se promueve a fixed + spacer 1260px (desktop).
     2. IntroScroll   — sticky + spacer 2740px (desktop).
     3. ServicesRows  — z-content, queda encima del hero/intro mientras sube.
     4. WorkGrid      — z-content.
     5. ClientsMarquee— z-content.
   Footer viene del layout.tsx.
   ========================================================================== */

export default async function HomePage({ params }: PageProps) {
  // Locale await (Next 15 API), se reserva por si en el futuro queremos
  // pasar contenido localizado a los componentes directamente.
  await params

  return (
    <>
      <HeroScroll
        posterSrc="/home/hero-poster.webp"
        posterAlt=""
        // videoSrc: undefined — Fase 1 usa Ken-Burns del poster como fallback.
      />

      <IntroScroll />

      <ServicesRows />

      <WorkGrid />

      <ClientsMarquee />
    </>
  )
}
