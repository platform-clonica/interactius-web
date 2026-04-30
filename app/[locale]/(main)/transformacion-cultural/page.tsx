import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { CapacityHeroSequence } from '@/components/capacity/CapacityHeroSequence'
import { CapacityServices } from '@/components/capacity/CapacityServices'
import { CapacityOthers } from '@/components/capacity/CapacityOthers'
import { CapacityManifiesto } from '@/components/capacity/CapacityManifiesto'
import { ClientsMarquee } from '@/components/capacity/ClientsMarquee'
import { richComponents } from '@/lib/i18n/rich-text'
import type { CapacityService } from '@/components/capacity/CapacityServices'
import type { CapacityOtherItem } from '@/components/capacity/CapacityOthers'
import type { RouteId } from '@/lib/i18n/navigation'
import { buildPageMetadata } from '@/lib/seo/metadata.config'
import { getAlternates, localizedPath } from '@/lib/i18n/navigation'
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
      <CapacityManifiesto
        title={t('transformacion.manifiesto.title')}
        body1={t.rich('transformacion.manifiesto.body1', richComponents.bold)}
        body2={t('transformacion.manifiesto.body2')}
        imageSrc="/capacidades/transformacion3.webp"
      />

      <CapacityOthers
        items={others.map((o) => ({ ...o, href: o.href as RouteId })) as [CapacityOtherItem, CapacityOtherItem]}
        sectionLabel={t('sections.otherCapacities')}
      />
    </>
  )
}
