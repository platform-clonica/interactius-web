import type { ReactNode } from 'react'

import { DossierSection } from './DossierSection'

/* DossierMasthead — la cabecera, construida como la mancheta de un diario.

   Orden de lectura: rótulo de sección, nombre del dossier en serif grande,
   línea de edición entre dos filetes, y entradilla a dos columnas.

   La entradilla va a dos columnas en pantallas anchas porque es el gesto que
   más dice "periódico" sin pedir ningún recurso gráfico nuevo. Usa columnas
   CSS en vez de rejilla para que el texto fluya solo: si Martina alarga o
   acorta el texto, las columnas se reequilibran sin tocar nada. */
export function DossierMasthead({
  eyebrow,
  title,
  edition,
  contents,
  standfirst,
  summary,
}: {
  eyebrow: string
  title: string
  edition: string
  contents: string
  standfirst: ReactNode
  summary: string
}) {
  return (
    <DossierSection className="pt-section-md lg:pt-section">
      <header>
        <p className="font-mono text-caption uppercase tracking-[0.2em] text-fg/60">{eyebrow}</p>

        <h1 className="mt-5 font-serif text-display font-light text-fg">{title}</h1>

        <div className="mt-8 flex flex-col gap-1 border-y border-fg/25 py-3 sm:flex-row sm:items-baseline sm:justify-between">
          <span className="font-mono text-caption uppercase tracking-[0.14em] text-fg/70">
            {edition}
          </span>
          <span className="font-mono text-caption uppercase tracking-[0.14em] text-fg/50">
            {contents}
          </span>
        </div>

        <div className="mt-10 lg:columns-2 lg:gap-grid-gutter">
          <div className="font-mono text-body-sm leading-[1.6] text-fg [&>strong]:font-semibold break-inside-avoid">
            {standfirst}
          </div>
          <p className="mt-6 font-mono text-body-sm leading-[1.6] text-fg/70 lg:mt-0">{summary}</p>
        </div>
      </header>
    </DossierSection>
  )
}
