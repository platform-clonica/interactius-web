import { type HTMLAttributes } from 'react'

/**
 * Section — wrapper semántico reutilizable para secciones de página.
 *
 * Encapsula el patrón repetido en >15 componentes:
 *   <section className="w-full bg-{variant}">
 *     <div className="section-inner py-section">
 *       {children}
 *     </div>
 *   </section>
 *
 * Props:
 * - variant: color de fondo semántico (default: 'surface')
 * - innerClassName: clases extras para el div interior (section-inner)
 * - noPadding: si true, omite py-section en el inner div
 * - as: elemento raíz (default: 'section')
 *
 * Uso:
 *   <Section aria-label="Servicios">
 *     <h2>...</h2>
 *   </Section>
 *
 *   <Section variant="warm-light" noPadding innerClassName="py-32">
 *     ...
 *   </Section>
 */

type SectionVariant = 'surface' | 'warm-light' | 'dark' | 'bg' | 'none'

const VARIANT_CLASSES: Record<SectionVariant, string> = {
  surface: 'bg-surface',
  'warm-light': 'bg-warm-light',
  dark: 'bg-dark',
  bg: 'bg-bg',
  none: '',
}

interface SectionProps extends HTMLAttributes<HTMLElement> {
  variant?: SectionVariant
  innerClassName?: string
  noPadding?: boolean
  as?: 'section' | 'div' | 'article' | 'aside'
  children: React.ReactNode
}

export function Section({
  variant = 'surface',
  innerClassName = '',
  noPadding = false,
  as: Tag = 'section',
  children,
  className = '',
  ...rest
}: SectionProps) {
  return (
    <Tag className={`w-full ${VARIANT_CLASSES[variant]} ${className}`} {...rest}>
      <div className={`section-inner ${noPadding ? '' : 'py-section'} ${innerClassName}`.trim()}>
        {children}
      </div>
    </Tag>
  )
}
