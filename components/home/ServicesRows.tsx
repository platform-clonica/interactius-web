import { getTranslations } from 'next-intl/server'

import { ServiceRow } from './ServiceRow'
import type { RouteId } from '@/lib/i18n/routing'

/**
 * ServicesRows — sección "Lo que hacemos" en la Home.
 *
 * 3 filas, una por pilar. Cada fila:
 *   [número grande] [nombre del pilar] [descripción + chips]
 *
 * Desktop: 3 columnas (1-3-8 del grid 12).
 * Mobile: 2 columnas (número compacto + stack).
 *
 * Fondo blanco (surface) con z-content — queda encima del hero fixed
 * durante el scroll para crear el efecto de "el contenido sólido sube
 * sobre la cabecera fluida".
 */

interface PillarData {
  number: string
  name: string
  description: string
  services: string[]
  /** Href opcional — si existe, toda la fila es clickable. */
  href?: RouteId
}

const PILLARS: PillarData[] = [
  {
    number: '1',
    name: 'Pensamiento estratégico',
    description:
      'Diseñamos la arquitectura de decisiones que orientan a las organizaciones en contextos de incertidumbre.',
    services: [
      'Diseño estratégico',
      'Estrategias de marca',
      'Estrategias de innovación',
      'Prospectiva estratégica',
    ],
    href: '/pensamiento-estrategico',
  },
  {
    number: '2',
    name: 'Diseño de experiencias',
    description:
      'Convertimos la estrategia en productos y servicios validados, reduciendo riesgo y acelerando impacto.',
    services: [
      'Diseño de productos y servicios',
      'Validación de producto',
      'Clonica® Usuarios sintéticos',
      'Insight Panel® Reclutamiento de usuarios',
    ],
    href: '/activacion-de-soluciones',
  },
  {
    number: '3',
    name: 'Transformación cultural',
    description:
      'Acompañamos la evolución organizativa alineando cultura, capacidades y tecnología para transformar la manera en que la organización decide y actúa.',
    services: [
      'Cultura organizacional',
      'Inteligencia Artificial Aplicada',
      'Bootcamps y Workshops para empresas',
    ],
    href: '/transformacion-cultural',
  },
]

export async function ServicesRows() {
  const t = await getTranslations('home')
  const title = t('services.title')

  return (
    <section
      aria-labelledby="services-heading"
      className="relative z-content w-full bg-surface"
    >
      <div className="section-inner py-section">
        <h2
          id="services-heading"
          className="font-serif text-section font-normal text-fg"
        >
          {title}
        </h2>

        <div className="mt-16 flex flex-col">
          {PILLARS.map((pillar, i) => (
            <ServiceRow
              key={pillar.number}
              data={pillar}
              isFirst={i === 0}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
