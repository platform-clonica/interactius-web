import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { CapacityHero } from '@/components/capacity/CapacityHero'
import { CapacityIntro } from '@/components/capacity/CapacityIntro'
import { CapacityServices } from '@/components/capacity/CapacityServices'
import { CapacityOthers } from '@/components/capacity/CapacityOthers'
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
    routeId: '/activacion-de-soluciones',
    title: 'Diseño de experiencias',
    description:
      'Investigamos, diseñamos y validamos. Activamos soluciones auténticas a partir de metodologías propias y herramientas de IA aplicada con criterio humano.',
    pathname: localizedPath('/activacion-de-soluciones', locale),
    alternates: getAlternates('/activacion-de-soluciones'),
  })
}

export default async function DisenoExperiencias({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'capacidades' })

  const services = t.raw('activacion.services') as CapacityService[]
  const others = t.raw('activacion.others') as Array<{ title: string; description: string; href: string }>

  return (
    <>
      <CapacityHero
        title={t('activacion.hero.title')}
        lead={t('activacion.hero.lead')}
      />

      <CapacityIntro
        statement={t('activacion.intro.statement')}
        clients={t('activacion.intro.clients')}
      />

      <CapacityServices
        services={services}
        sectionLabel={t('sections.services')}
      />

      <CapacityOthers
        items={others.map((o) => ({ ...o, href: o.href as RouteId })) as [CapacityOtherItem, CapacityOtherItem]}
        sectionLabel={t('sections.otherCapacities')}
      />
    </>
  )
}
