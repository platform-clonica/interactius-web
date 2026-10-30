/* DossierAside — la recomendación firmada, como la columna lateral de un diario.

   Es la única pieza del dossier sobre fondo blanco, y va con filete completo
   alrededor. Las dos cosas la separan del resto sin necesidad de ningún
   recurso nuevo: se lee como un recuadro, que es exactamente lo que es.

   El enlace sale fuera del sitio, así que lleva target y rel. */
export function DossierAside({
  by,
  format,
  title,
  body,
  cta,
  href,
}: {
  by: string
  format: string
  title: string
  body: string
  cta: string
  href: string
}) {
  return (
    <aside className="border border-fg/25 bg-surface p-7 lg:p-10">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-caption uppercase tracking-[0.2em] text-fg">{by}</span>
        <span className="font-mono text-caption uppercase tracking-[0.14em] text-fg/50">
          {format}
        </span>
      </div>

      <h3 className="mt-5 font-serif text-title-sm font-light text-fg">{title}</h3>

      <p className="mt-4 font-mono text-body-sm leading-[1.6] text-fg/70">{body}</p>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="hover-wipe-underline mt-6 inline-flex w-fit font-mono text-caption uppercase tracking-[0.14em] text-fg"
      >
        {cta}
      </a>
    </aside>
  )
}
