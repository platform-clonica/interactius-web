/* DossierAside — una recomendación firmada, como el recuadro de un diario.

   Es la única pieza del dossier sobre fondo blanco, y va con filete completo
   alrededor. Las dos cosas la separan del resto sin necesidad de ningún
   recurso nuevo: se lee como un recuadro, que es exactamente lo que es.

   Van dos en paralelo, así que el bloque se compacta respecto a la versión
   anterior: el cuerpo baja a `text-micro` y el relleno se reduce. A tamaño de
   cuerpo y con una sola caja ancha, el texto se leía como un artículo más y
   competía con las piezas de verdad del dossier. Esto es una recomendación,
   no una pieza.

   `h-full` sí tiene sentido aquí: las dos cajas son hermanas en una rejilla y
   deben acabar a la misma altura aunque un texto sea más largo. El enlace se
   empuja al fondo con `mt-auto` para que las dos líneas finales se alineen.

   El enlace sale fuera del sitio, así que lleva target y rel. */
export function DossierAside({
  by,
  format,
  source,
  title,
  body,
  cta,
  href,
}: {
  by: string
  format: string
  /** El programa o canal del que sale la pieza, si no es el propio título. */
  source?: string
  title: string
  body: string
  cta: string
  href: string
}) {
  return (
    <aside className="flex h-full flex-col border border-fg/25 bg-surface p-6 lg:p-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-caption uppercase tracking-[0.2em] text-fg">{by}</span>
        <span className="font-mono text-caption uppercase tracking-[0.14em] text-fg/50">
          {format}
        </span>
      </div>

      {source ? (
        <p className="mt-4 font-mono text-caption uppercase tracking-[0.14em] text-fg/40">
          {source}
        </p>
      ) : null}

      <h3 className={`font-serif text-title-sm font-light text-fg ${source ? 'mt-2' : 'mt-4'}`}>
        {title}
      </h3>

      <p className="mt-4 font-mono text-micro leading-[1.6] text-fg/70">{body}</p>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="hover-wipe-underline mt-auto inline-flex w-fit pt-6 font-mono text-caption uppercase tracking-[0.14em] text-fg"
      >
        {cta}
      </a>
    </aside>
  )
}
