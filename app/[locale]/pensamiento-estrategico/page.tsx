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
    routeId: '/pensamiento-estrategico',
    pathname: localizedPath('/pensamiento-estrategico', locale),
    alternates: getAlternates('/pensamiento-estrategico'),
  })
}

export default async function PensamientoEstrategico({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'capacidades' })

  const services = t.raw('pensamiento.services') as CapacityService[]
  const others = t.raw('pensamiento.others') as Array<{ title: string; description: string; href: string }>

  return (
    <>
      <CapacityHero
        title={t('pensamiento.hero.title')}
        lead={t('pensamiento.hero.lead')}
      />

      <CapacityIntro
        statement={t('pensamiento.intro.statement')}
        clients={t('pensamiento.intro.clients')}
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
