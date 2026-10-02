import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ContactHero } from '@/components/contact/ContactHero'
import { ContactForm } from '@/components/contact/ContactForm'

import { buildPageMetadata } from '@/lib/seo/metadata.config'
import { getAlternates, localizedPath } from '@/lib/i18n/navigation'
import { type Locale } from '@/lib/i18n/config'

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    routeId: '/barcelona-design-week-2026',
    pathname: localizedPath('/barcelona-design-week-2026', locale),
    alternates: getAlternates('/barcelona-design-week-2026'),
  })
}

export default async function BarcelonaDesignWeekPage({ params }: PageProps) {
  await params
  const t = await getTranslations('contacto')

  return (
    <ContactHero variant="bdw">
      {/* ── Taller completo: las 16 plazas se agotaron ───────────────────────
          El formulario se conserva visible y desenfocado para no vaciar la
          columna derecha, pero queda fuera de servicio de verdad, no solo
          tapado:
            · `inert` lo saca del orden de tabulación y del árbol de
              accesibilidad. Sin él el formulario seguiría siendo navegable
              con teclado y un lector de pantalla lo leería campo por campo
              por debajo del aviso. Mismo patrón que `MenuOverlay`.
            · `pointer-events-none` bloquea el ratón.
          El aviso va en un hermano y no dentro del bloque desenfocado, para
          que se lea nítido y sí llegue a los lectores de pantalla.

          Para reabrir inscripciones basta con devolver `<ContactForm />` a su
          sitio: ni el componente ni `/api/bdw` se han tocado. ────────────── */}
      <div className="relative">
        <div
          aria-hidden="true"
          {...{ inert: true }}
          className="pointer-events-none select-none blur-[3px] opacity-60"
        >
          <ContactForm variant="bdw" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p
            role="status"
            className="bg-warm-light px-8 py-6 text-center font-mono text-body-sm font-medium text-fg"
          >
            {t('bdw.soldOut')}
          </p>
        </div>
      </div>
    </ContactHero>
  )
}
