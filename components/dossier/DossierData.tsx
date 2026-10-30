import { DossierReveal } from './DossierReveal'
import { DossierSection } from './DossierSection'

/* DossierData — la banda de datos, en negativo.

   Es la única sección del dossier sobre fondo oscuro. Funciona como el panel
   invertido de un diario: corta la página por la mitad, separa la apertura
   del cuerpo y marca que aquí hay cifras, no opinión.

   Sobre los colores de las barras: los tres acentos de marca (Opal, Burdeos,
   Esmeralda) identifican cada uno un servicio y `lib/tokens.ts` prohíbe
   usarlos como decoración. Una barra de un gráfico es decoración, así que la
   comparativa se resuelve solo con neutros: la barra del dato nuevo en Warm
   Light opaco y la del dato viejo al 25 %. El contraste lo da la opacidad,
   no el color.

   `tabular-nums` en las cifras para que los dígitos ocupen lo mismo y las
   tres columnas queden ópticamente alineadas. */
export function DossierData({
  eyebrow,
  title,
  intro,
  items,
  precedent,
  note,
  noteHighlight,
}: {
  eyebrow: string
  title: string
  intro: string
  items: { figure: string; unit?: string; label: string; source: string }[]
  precedent: {
    title: string
    body: string
    fromLabel: string
    fromValue: string
    toLabel: string
    toValue: string
  }
  note: string
  /** La conclusión de la nota, sacada aparte para ir como titular. */
  noteHighlight: string
}) {
  return (
    <section className="bg-dark text-warm-light">
      <DossierSection className="py-section-md lg:py-section">
        <p className="font-mono text-caption uppercase tracking-[0.2em] text-warm-light/50">
          {eyebrow}
        </p>

        <div className="mt-6 grid grid-cols-12 gap-x-grid-gutter">
          <h2 className="col-span-12 font-serif text-title font-light lg:col-span-7">{title}</h2>
          <p className="col-span-12 mt-4 self-end font-mono text-body-sm leading-[1.6] text-warm-light/70 lg:col-span-4 lg:col-start-9 lg:mt-0">
            {intro}
          </p>
        </div>

        <DossierReveal stagger={0.12}>
          <dl className="mt-14 grid grid-cols-12 gap-x-grid-gutter gap-y-10 border-t border-warm-light/25 pt-10">
            {items.map((d) => (
              <div key={d.figure} className="col-span-12 sm:col-span-6 lg:col-span-4">
                {/* Número y unidad separados: a tamaño display, "760 000 M$"
                  en una sola pieza parte en dos líneas y descuadra las tres
                  columnas. Con la unidad más pequeña y en su propia caja, las
                  tres cifras se alinean por la base pase lo que pase. */}
                <dt className="flex items-baseline gap-2 font-serif font-light">
                  <span className="text-display tabular-nums whitespace-nowrap">{d.figure}</span>
                  {d.unit ? <span className="text-title text-warm-light/70">{d.unit}</span> : null}
                </dt>
                <dd className="mt-3 font-mono text-body-sm leading-[1.6] text-warm-light/80">
                  {d.label}
                </dd>
                <dd className="mt-3 font-mono text-caption uppercase tracking-[0.14em] text-warm-light/40">
                  {d.source}
                </dd>
              </div>
            ))}
          </dl>
        </DossierReveal>

        {/* El precedente del teletrabajo: dos barras comparadas. No es el tema
            del dossier, es la analogía que explica por qué una adopción puede
            dispararse en meses. Por eso va aparte, con su propia caja. */}
        <div className="mt-14 grid grid-cols-12 gap-x-grid-gutter gap-y-8 border-t border-warm-light/25 pt-10">
          <div className="col-span-12 lg:col-span-5">
            <h3 className="font-serif text-title-sm font-light">{precedent.title}</h3>
            <p className="mt-4 font-mono text-body-sm leading-[1.6] text-warm-light/70">
              {precedent.body}
            </p>
          </div>

          <div className="col-span-12 flex flex-col justify-center gap-6 lg:col-span-6 lg:col-start-7">
            {[
              {
                l: precedent.fromLabel,
                v: precedent.fromValue,
                pct: 5,
                fuerte: false,
              },
              {
                l: precedent.toLabel,
                v: precedent.toValue,
                pct: 37,
                fuerte: true,
              },
            ].map((b) => (
              <div key={b.l}>
                <div className="flex items-baseline justify-between font-mono text-caption uppercase tracking-[0.14em] text-warm-light/60">
                  <span>{b.l}</span>
                  <span className="tabular-nums text-warm-light">{b.v}</span>
                </div>
                {/* La barra es decorativa: el dato ya está en el texto de
                    arriba, que es lo que lee un lector de pantalla. */}
                <div className="mt-2 h-3 w-full bg-warm-light/10" aria-hidden="true">
                  <div
                    className={`h-full ${b.fuerte ? 'bg-warm-light' : 'bg-warm-light/30'}`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* La nota de cierre va a dos cajas: el razonamiento a la izquierda en
            mono, y su conclusión a la derecha en serif grande. La conclusión
            es la frase que más pesa de toda la sección y dentro del párrafo
            quedaba enterrada al final; además la derecha estaba vacía. */}
        <div className="mt-12 grid grid-cols-12 items-center gap-x-grid-gutter gap-y-8 border-t border-warm-light/25 pt-8">
          <p className="col-span-12 font-mono text-body-sm leading-[1.6] text-warm-light/70 lg:col-span-6">
            {note}
          </p>
          <p className="col-span-12 font-serif text-title-sm font-light leading-tight text-warm-light lg:col-span-5 lg:col-start-8">
            {noteHighlight}
          </p>
        </div>
      </DossierSection>
    </section>
  )
}
