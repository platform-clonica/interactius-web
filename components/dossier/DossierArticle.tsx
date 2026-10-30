import Image from 'next/image'

import { CurtainLink } from '@/components/layout/CurtainLink'
import type { IntlHref } from '@/lib/i18n/article-href'

/* DossierArticle — una pieza del dossier que remite a un artículo de Miradas.

   Dos tratamientos, como en la portada de un diario:

   · `lead`    la apertura. Foto ancha arriba, titular grande y entradilla a
               dos columnas. Ocupa todo el ancho de la mancha.
   · `column`  una columna del cuerpo. Más estrecha, titular menor y foto
               opcional, para que dos piezas contiguas no se vean iguales.

   La foto es opcional a propósito: Martina pidió que unas noticias lleven
   imagen y otras no, que es justo lo que rompe la monotonía de una retícula.
   Cuando no hay foto, la pieza gana una regla superior gruesa para que el
   hueco no se lea como un olvido. */
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
}) {
  const esLead = variant === 'lead'

  return (
    <article className={esLead ? '' : 'flex h-full flex-col'}>
      {image ? (
        <CurtainLink href={href} className="group block overflow-hidden">
          <div
            className={`relative w-full overflow-hidden ${esLead ? 'aspect-[16/7]' : 'aspect-[4/3]'}`}
          >
            <Image
              src={image}
              alt={imageAlt ?? ''}
              fill
              sizes={esLead ? '100vw' : '(max-width: 900px) 100vw, 50vw'}
              className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        </CurtainLink>
      ) : (
        <div className="border-t-2 border-fg" aria-hidden="true" />
      )}

      <p
        className={`font-mono text-caption uppercase tracking-[0.14em] text-fg/60 ${
          image ? 'mt-5' : 'mt-4'
        }`}
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
        <p className="font-mono text-body-sm leading-[1.6] text-fg break-inside-avoid">
          {standfirst}
        </p>
        <p className="mt-4 font-mono text-body-sm leading-[1.6] text-fg/70">{body}</p>
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
