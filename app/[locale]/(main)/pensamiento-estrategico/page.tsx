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

  const capacityTitle = t('pensamiento.hero.title')

  return (
    <>
      <CapacityHeroSequence
        title={capacityTitle}
        lead={t.rich('pensamiento.hero.lead', {
          // <strong> en JSON renderiza como h2 con estilo del tagline de la
          // home — actúa como titular tipográfico del lead.
          strong: (chunks) => (
            <h2 className="font-serif text-title-sm font-light text-fg">{chunks}</h2>
          ),
          p: (chunks) => <p>{chunks}</p>,
        })}
        statement={t.rich('pensamiento.intro.statement', richComponents.boldWord)}
        imageSrc="/capacidades/pensamiento-hero-right.webp"
        imageBottomSrc="/capacidades/pensamiento-hero-bottom.webp"
      />

      <ClientsMarquee clients={t('pensamiento.intro.clients')} />

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
