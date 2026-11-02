import { DossierReveal } from './DossierReveal'
import { DossierSection } from './DossierSection'

/* DossierMasthead — la cabecera, construida como la mancheta de un diario.

   Orden de lectura: rótulo de sección, nombre del dossier en serif grande,
   línea de edición entre dos filetes, la frase tesis como titular, y el
   cuerpo de la entradilla repartido en dos columnas parejas.

   Por qué la frase va fuera de las columnas: es la tesis del dossier y, metida
   dentro del cuerpo en negrita, desequilibraba el reparto (una columna se
   comía a la otra). Sacándola arriba hace de titular, que es lo que es, y deja
   las dos columnas de debajo con una longitud parecida.

   Las columnas se montan con rejilla y no con `columns-2` de CSS: aquí los dos
   textos son piezas distintas (el cuerpo y el sumario de contenidos), no un
   único texto que deba fluir de una a otra. */
export function DossierMasthead({
  eyebrow,
  title,
  edition,
  contents,
  headline,
  standfirst,
  summary,
}: {
  eyebrow: string
  title: string
  edition: string
  contents: string
  /** La frase tesis, destacada como titular bajo la mancheta. */
  headline: string
  standfirst: string
  summary: string
}) {
  return (
    <DossierSection className="pt-section-md lg:pt-section">
      <DossierReveal>
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

          <p className="mt-10 max-w-[22ch] font-serif text-title font-light leading-tight text-fg sm:max-w-[26ch] lg:max-w-[34ch]">
            {headline}
          </p>

          <div className="mt-10 grid grid-cols-12 gap-x-grid-gutter gap-y-6">
            <p className="col-span-12 font-mono text-body-sm leading-[1.6] text-fg lg:col-span-6">
              {standfirst}
            </p>
            <p className="col-span-12 font-mono text-body-sm leading-[1.6] text-fg/70 lg:col-span-5 lg:col-start-8">
              {summary}
            </p>
          </div>
        </header>
      </DossierReveal>
    </DossierSection>
  )
}
