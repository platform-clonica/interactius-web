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

export async function ServicesRows() {
  const t = await getTranslations('home')
  const pillars = t.raw('services.pillars') as PillarData[]

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
          {t('services.title')}
        </h2>

        <div className="mt-16 flex flex-col">
          {pillars.map((pillar, i) => (
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
