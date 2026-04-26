import { getTranslations } from 'next-intl/server'

import { ServiceRow } from './ServiceRow'
import type { RouteId } from '@/lib/i18n/routing'

/**
 * ServicesRows — sección "Servicios" en la Home.
 *
 * Layout:
 * - Super title "Servicios" full-width con bleed left (igual que Metodología
 *   en Identidad: fuera de section-inner, marginLeft negativo).
 * - Headline lead `text-title-sm` debajo, ancho hasta col 12.
 * - 3 filas con reveal lateral al entrar en viewport.
 *   · número col 3, nombre col 4-6, descripción+labels col 7-11, + col 12.
 *   · Stroke top de cada fila ocupa el ANCHO COMPLETO del viewport (de
 *     borde a borde), no solo el section-inner.
 * - Bg warm-light. Labels con estilo idéntico al de las páginas de detalle.
 */

interface PillarData {
  number: string
  name: string
  description: string
  services: string[]
  href?: RouteId
}

export async function ServicesRows() {
  const t = await getTranslations('home')
  const pillars = t.raw('services.pillars') as PillarData[]

  return (
    <section
      aria-labelledby="services-heading"
      className="relative z-content w-full bg-warm-light"
    >
      {/* Super title — fuera de section-inner para sangrar a la izquierda */}
      <div className="relative overflow-hidden pt-section pb-1 lg:pb-2">
        <h2
          id="services-heading"
          className="font-serif font-normal text-fg text-super whitespace-nowrap select-none"
          style={{ marginLeft: 'calc(-1 * clamp(6px, 0.8vw, 18px))' }}
        >
          {t('services.title')}
        </h2>
      </div>

      {/* Headline lead — section-inner */}
      <div className="section-inner">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <p className="col-span-12 lg:col-start-2 lg:col-span-11 font-serif font-light text-fg text-title-sm leading-tight">
            {t('services.lead')}
          </p>
        </div>
      </div>

      {/* Rows — fuera de section-inner para que el stroke top sea full viewport */}
      <div className="mt-12 lg:mt-20 pb-section flex flex-col">
        {pillars.map((pillar) => (
          <ServiceRow key={pillar.number} data={pillar} />
        ))}
      </div>
    </section>
  )
}
