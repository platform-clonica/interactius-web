import { CurtainLink } from '@/components/layout/CurtainLink'

import { DossierParallaxImage } from './DossierParallaxImage'
import type { IntlHref } from '@/lib/i18n/article-href'

/* DossierArticle — una pieza del dossier que remite a un artículo de Miradas.

   Dos tratamientos, como en la portada de un diario:

   · `lead`    la apertura. Foto ancha arriba, titular grande y entradilla a
               dos columnas. Ocupa todo el ancho de la mancha.
   · `column`  una columna del cuerpo. Más estrecha, titular y texto menores y
               foto opcional, para que dos piezas contiguas no se vean iguales.

   La foto es opcional a propósito: Martina pidió que unas noticias lleven
   imagen y otras no, que es justo lo que rompe la monotonía de una retícula.

   El filete superior va en el color del servicio al que pertenece el artículo
   (ver `accent.ts`). No es decoración: es el mismo código de color que usa la
   home para señalar de qué servicio habla cada cosa, y sale del
   `parentCategory` del MDX. Cuando no hay foto es además lo que impide que el
   hueco se lea como un olvido. */
export function DossierArticle({
  variant,
  kicker,
  title,
  author,
  byLabel,
  standfirst,
  body,
  href,
  readLabel,
  image,
  imageAlt,
  acentoFondo,
  acentoChipTexto,
}: {
  variant: 'lead' | 'column'
  kicker: string
  title: string
  author: string
  byLabel: string
  standfirst: string
  body: string
  href: IntlHref
  readLabel: string
  image?: string
  imageAlt?: string
  /** Clase de fondo del servicio, para el filete y la etiqueta. */
  acentoFondo: string
  /** Color del texto sobre ese fondo. Ver la tabla de contraste de `accent.ts`. */
  acentoChipTexto: string
}) {
  const esLead = variant === 'lead'
  const cuerpo = esLead ? 'text-body-sm' : 'text-micro'

  return (
    /* Sin `h-full`: con él, el artículo tomaba toda la altura de la fila de
       la rejilla y cualquier hermano que se le pusiera debajo (como la
       infografía de Gartner) se salía de la caja sin que la fila creciera.
       Medido: la sección daba 884 px de alto con 1380 px de contenido. */
    <article className={esLead ? '' : 'flex flex-col'}>
      <div className={`h-[3px] w-full ${acentoFondo}`} aria-hidden="true" />

      {image ? (
        <CurtainLink href={href} className="group mt-5 block overflow-hidden">
          <DossierParallaxImage
            src={image}
            alt={imageAlt ?? ''}
            sizes={esLead ? '100vw' : '(max-width: 900px) 100vw, 50vw'}
            ratio={esLead ? 'aspect-[16/7]' : 'aspect-[4/3]'}
            conHover
          />
        </CurtainLink>
      ) : null}

      {/* El rótulo va sobre relleno, no en color de texto: Opal y Esmeralda
          no llegan al contraste mínimo como tinta sobre el fondo de la web. */}
      <p
        className={`mt-5 inline-flex w-fit px-2 py-1 font-mono text-caption uppercase tracking-[0.14em] ${acentoFondo} ${acentoChipTexto}`}
      >
        {kicker}
      </p>

      <h2
        className={`mt-3 font-serif font-light text-fg ${esLead ? 'text-title' : 'text-title-sm'}`}
      >
        <CurtainLink href={href} className="hover-wipe-underline">
          {title}
        </CurtainLink>
      </h2>

      <p className="mt-3 font-mono text-caption uppercase tracking-[0.14em] text-fg/50">
        {byLabel} {author}
      </p>

      <div className={esLead ? 'mt-6 lg:columns-2 lg:gap-grid-gutter' : 'mt-5'}>
        <p className={`break-inside-avoid font-mono leading-[1.6] text-fg ${cuerpo}`}>
          {standfirst}
        </p>
        <p className={`mt-4 font-mono leading-[1.6] text-fg/70 ${cuerpo}`}>{body}</p>
      </div>

      <CurtainLink
        href={href}
        className="hover-wipe-underline mt-6 inline-flex w-fit font-mono text-caption uppercase tracking-[0.14em] text-fg"
      >
        {readLabel}
      </CurtainLink>
    </article>
  )
}
