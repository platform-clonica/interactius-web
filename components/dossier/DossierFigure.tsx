import Image from 'next/image'

/* DossierFigure — una imagen a todo el ancho con su pie.

   Es el recurso que un diario usa para romper una tirada larga de texto: una
   foto grande que sostiene por sí sola lo que el artículo está argumentando.

   El pie va en mono pequeño, igual que los pies de foto del blog, y lleva la
   atribución al artículo del que sale la imagen para que se vea que el dato
   tiene procedencia y no es una ilustración de archivo. */
export function DossierFigure({
  src,
  alt,
  caption,
  credit,
  ratio = 'aspect-[16/9]',
}: {
  src: string
  alt: string
  caption: string
  credit?: string
  ratio?: string
}) {
  return (
    <figure>
      <div className={`relative w-full overflow-hidden border border-fg/15 ${ratio}`}>
        <Image src={src} alt={alt} fill sizes="100vw" className="object-cover object-center" />
      </div>
      <figcaption className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-micro leading-[1.5] text-fg/60">
        <span>{caption}</span>
        {credit ? (
          <span className="text-caption uppercase tracking-[0.14em] text-fg/40">{credit}</span>
        ) : null}
      </figcaption>
    </figure>
  )
}
