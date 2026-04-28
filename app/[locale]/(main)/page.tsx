import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { HeroScroll } from '@/components/home/HeroScroll'
import { HomeIntroText } from '@/components/home/HomeIntroText'
import { HomeIntroReveal } from '@/components/home/HomeIntroReveal'
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
     1. HeroScroll      — fixed + spacer 1260px (desktop).
     2. HomeIntroText   — sticky lead text con bold-effect.
     3. HomeIntroReveal — strip image + crop overlay sobre cuadro blanco.
     4. ServicesRows    — z-content.
     5. WorkGrid        — z-content.
     6. ClientsMarquee  — z-content.
   Footer viene del layout.tsx.
   ========================================================================== */

export default async function HomePage({ params }: PageProps) {
  await params
  const t = await getTranslations('home')

  return (
    <>
      <HeroScroll
        posterSrc="/home/hero-poster.webp"
        posterAlt=""
        videoSrc="/home/hero-poster.mp4"
      >
        <div className="grid grid-cols-12 gap-grid-gutter">
          <h1 className="col-span-12 lg:col-start-2 lg:col-span-9 font-serif text-section font-light text-fg">
            {t.rich('hero.tagline', {
              em: (chunks) => <em>{chunks}</em>,
              strong: (chunks) => <span data-word="">{chunks}</span>,
            })}
          </h1>
        </div>
      </HeroScroll>

      <HomeIntroText />

      <HomeIntroReveal />

      <ServicesRows />

      <WorkGrid />

      <ClientsMarquee />
    </>
  )
}
