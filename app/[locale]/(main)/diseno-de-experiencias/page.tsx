import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { CapacityHeroSequence } from '@/components/capacity/CapacityHeroSequence'
import { CapacityServices } from '@/components/capacity/CapacityServices'
import { CapacityOthers } from '@/components/capacity/CapacityOthers'
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
    routeId: '/diseno-de-experiencias',
    title: 'Diseño de experiencias',
    description:
      'Investigamos, diseñamos y validamos. Diseñamos experiencias auténticas a partir de metodologías propias y herramientas de IA aplicada con criterio humano.',
    pathname: localizedPath('/diseno-de-experiencias', locale),
    alternates: getAlternates('/diseno-de-experiencias'),
  })
}

export default async function DisenoDeExperiencias({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'capacidades' })

  const services = t.raw('experiencias.services') as CapacityService[]
  const others = t.raw('experiencias.others') as Array<{ title: string; description: string; href: string }>

  const capacityTitle = t('experiencias.hero.title')

  return (
    <>
      <CapacityHeroSequence
        title={capacityTitle}
        lead={t.rich('experiencias.hero.lead', {
          strong: (chunks) => (
            <h2 className="font-serif text-title-sm font-light text-fg">{chunks}</h2>
          ),
          p: (chunks) => <p>{chunks}</p>,
        })}
        statement={t.rich('experiencias.intro.statement', richComponents.boldWord)}
        imageSrc="/capacidades/experiencias-hero-right.webp"
        imageBottomSrc="/capacidades/experiencias-hero-bottom.webp"
      />

      <ClientsMarquee clients={t('experiencias.intro.clients')} singleLine />

      <CapacityServices
        services={services}
        sectionLabel={t('sections.services')}
        capacityLabel={capacityTitle}
      />

      <CapacityOthers
        items={others.map((o) => ({ ...o, href: o.href as RouteId })) as [CapacityOtherItem, CapacityOtherItem]}
        sectionLabel={t('sections.otherCapacities')}
      />
    </>
  )
}
