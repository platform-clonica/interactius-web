import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { CapacityHeroSequence } from '@/components/capacity/CapacityHeroSequence'
import { CapacityServices } from '@/components/capacity/CapacityServices'
import { CapacityOthers } from '@/components/capacity/CapacityOthers'
import { ClientsMarquee } from '@/components/capacity/ClientsMarquee'
import { richComponents } from '@/lib/i18n/rich-text'
import type { CapacityService } from '@/components/capacity/CapacityServices'
import type { CapacityOtherItem } from '@/components/capacity/CapacityOthers'
import type { RouteId } from '@/lib/i18n/routing'
import { buildPageMetadata } from '@/lib/seo/metadata.config'
import { getAlternates, localizedPath } from '@/lib/i18n/routing'
import { type Locale } from '@/lib/i18n/config'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    routeId: '/transformacion-cultural',
    pathname: localizedPath('/transformacion-cultural', locale),
    alternates: getAlternates('/transformacion-cultural'),
  })
}

export default async function TransformacionCultural({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'capacidades' })

  const services = t.raw('transformacion.services') as CapacityService[]
  const others = t.raw('transformacion.others') as Array<{ title: string; description: string; href: string }>

  const capacityTitle = t('transformacion.hero.title')

  return (
    <>
      <CapacityHeroSequence
        title={capacityTitle}
        lead={t.rich('transformacion.hero.lead', {
          strong: (chunks) => (
            <h2 className="font-serif text-title-sm font-light text-fg">{chunks}</h2>
          ),
          p: (chunks) => <p>{chunks}</p>,
        })}
        statement={t.rich('transformacion.intro.statement', richComponents.boldWord)}
        imageSrc="/capacidades/transformacion-hero-right.webp"
        imageBottomSrc="/capacidades/transformacion-hero-bottom.webp"
      />

      <ClientsMarquee clients={t('transformacion.intro.clients')} />

      <CapacityServices
        services={services}
        sectionLabel={t('sections.services')}
        capacityLabel={capacityTitle}
      />

      {/* Manifiesto IA — sección exclusiva de Transformación cultural. NO replicar en otros servicios. */}
      <section className="w-full bg-dark" aria-labelledby="manifiesto-title">
        <div className="section-inner py-section">
          <div className="grid grid-cols-12 gap-grid-gutter">
            <div className="col-span-12 lg:col-span-4">
              <h2
                id="manifiesto-title"
                className="font-serif font-light text-pure-white text-section"
              >
                {t('transformacion.manifiesto.title')}
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-7 lg:col-start-6">
              <p className="font-mono text-body text-pure-white/80 max-w-[52ch]">
                {t('transformacion.manifiesto.body')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <CapacityOthers
        items={others.map((o) => ({ ...o, href: o.href as RouteId })) as [CapacityOtherItem, CapacityOtherItem]}
        sectionLabel={t('sections.otherCapacities')}
      />
    </>
  )
}
